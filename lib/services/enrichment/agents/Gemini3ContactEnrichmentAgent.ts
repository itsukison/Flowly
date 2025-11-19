/**
 * Gemini 3 Contact Enrichment Agent
 * Enriches existing records using Gemini 3 Pro with full row context
 * Uses ALL available row data to intelligently enrich target fields
 * Falls back to Firecrawl for low-confidence results
 */

import { Gemini3Service } from '../Gemini3Service';
import { FirecrawlService } from '../FirecrawlService';
import { EnrichmentField, SourceAttribution } from '../types';

export type ProgressCallback = (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;

export interface TableRecord {
  id: string;
  table_id?: string;
  organization_id?: string;
  name?: string | null;
  email?: string | null;
  company?: string | null;
  status?: string | null;
  data: Record<string, any> | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface FieldWithConfidence {
  name: string;
  value: any;
  confidence: number;
}

export interface EnrichedRecord {
  recordId: string;
  success: boolean;
  fields: FieldWithConfidence[];
  sources: SourceAttribution[];
  error?: string;
}

const CONFIDENCE_THRESHOLD = 0.70; // Below this, use Firecrawl fallback

export class Gemini3ContactEnrichmentAgent {
  private gemini3: Gemini3Service;
  private firecrawl: FirecrawlService;

  constructor(geminiApiKey: string, firecrawlApiKey: string) {
    this.gemini3 = new Gemini3Service(geminiApiKey);
    this.firecrawl = new FirecrawlService(firecrawlApiKey);
  }

  /**
   * Enrich a single record with target fields
   * Uses Gemini 3 with full context, uses Firecrawl for email/phone
   */
  async enrichRecord(
    record: TableRecord,
    targetFields: EnrichmentField[],
    onProgress?: ProgressCallback
  ): Promise<EnrichedRecord> {
    const recordName = record.name || record.company || `Record ${record.id}`;
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[Contact Enrichment] Enriching: ${recordName}`);
    console.log(`[Contact Enrichment] Target fields: ${targetFields.map(f => f.name).join(', ')}`);
    console.log(`${'='.repeat(80)}`);

    try {
      // Build context from ALL existing row data
      const context = this.buildRecordContext(record);
      
      // Separate fields: email/phone go to Firecrawl, others go to Gemini
      const emailPhoneFields = targetFields.filter(f => 
        f.name.toLowerCase().includes('email') || 
        f.name.toLowerCase().includes('phone') ||
        f.name.toLowerCase().includes('tel') ||
        f.name.toLowerCase().includes('contact')
      );
      const geminiFields = targetFields.filter(f => !emailPhoneFields.includes(f));
      
      const enrichedFields: Array<{ name: string; value: any; confidence: number }> = [];
      const sources: SourceAttribution[] = [];
      
      // Phase 1: Use Gemini for non-contact fields
      if (geminiFields.length > 0) {
        onProgress?.(`Enriching ${recordName} with Gemini...`, 'info');
        const geminiResult = await this.enrichWithGemini3(context, geminiFields, record);
        enrichedFields.push(...geminiResult.fields);
        sources.push(...geminiResult.sources);
      }
      
      // Phase 2: Use Firecrawl specifically for email/phone (Gemini is bad at these)
      const website = record.data?.website;
      if (emailPhoneFields.length > 0 && website) {
        onProgress?.(`Fetching contact info from ${website}...`, 'info');
        console.log(`[Contact Enrichment] Using Firecrawl for email/phone fields: ${emailPhoneFields.map(f => f.name).join(', ')}`);

        try {
          const firecrawlResult = await this.enrichWithFirecrawl(
            website,
            emailPhoneFields,
            recordName
          );
          
          enrichedFields.push(...firecrawlResult.fields);
          sources.push(...firecrawlResult.sources);
          
          onProgress?.(`Successfully enriched ${recordName}`, 'success');
        } catch (firecrawlError) {
          console.error(`[Contact Enrichment] Firecrawl failed for ${recordName}:`, firecrawlError);
          // Add empty fields for failed Firecrawl attempts
          emailPhoneFields.forEach(field => {
            enrichedFields.push({
              name: field.name,
              value: null,
              confidence: 0
            });
          });
          onProgress?.(`Could not fetch contact info for ${recordName}`, 'warning');
        }
      } else if (emailPhoneFields.length > 0 && !website) {
        // No website available, can't use Firecrawl
        console.log(`[Contact Enrichment] No website for ${recordName}, skipping email/phone enrichment`);
        emailPhoneFields.forEach(field => {
          enrichedFields.push({
            name: field.name,
            value: null,
            confidence: 0
          });
        });
      }
      
      return {
        recordId: record.id,
        success: true,
        fields: enrichedFields,
        sources,
      };
    } catch (error) {
      console.error(`[Contact Enrichment] Error enriching ${recordName}:`, error);
      
      return {
        recordId: record.id,
        success: false,
        fields: targetFields.map(f => ({ name: f.name, value: null, confidence: 0 })),
        sources: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build context string from ALL available record data
   */
  private buildRecordContext(record: TableRecord): string {
    const parts: string[] = [];
    
    // Add direct properties
    if (record.name) parts.push(`名前: ${record.name}`);
    if (record.company) parts.push(`会社名: ${record.company}`);
    if (record.email) parts.push(`メールアドレス: ${record.email}`);
    
    // Add JSONB data
    const data = record.data || {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        parts.push(`${key}: ${value}`);
      }
    });
    
    const context = parts.join('\n');
    console.log(`[Contact Enrichment] Context:\n${context}`);
    
    return context;
  }

  /**
   * Enrich using Gemini 3 with full context
   */
  private async enrichWithGemini3(
    context: string,
    targetFields: EnrichmentField[],
    record: TableRecord
  ): Promise<{ fields: FieldWithConfidence[]; sources: SourceAttribution[] }> {
    
    const prompt = this.buildEnrichmentPrompt(context, targetFields);
    
    console.log(`[Contact Enrichment] Calling Gemini 3 Pro...`);
    
    const result = await this.gemini3['model'].generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        ...this.gemini3['model'].generationConfig,
        thinkingConfig: {
          thinkingLevel: 'low', // Fast enrichment
        },
      },
    });
    
    const text = result.response.text();
    console.log(`[Contact Enrichment] Raw response:`, text.substring(0, 500));
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Gemini 3 response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.fields) {
      throw new Error('Invalid response format from Gemini 3');
    }
    
    // Build fields with confidence
    const fields: FieldWithConfidence[] = targetFields.map(field => {
      const fieldData = parsed.fields[field.name];
      
      if (fieldData && typeof fieldData === 'object') {
        console.log(`  ✓ ${field.name}: ${fieldData.value} (confidence: ${fieldData.confidence})`);
        return {
          name: field.name,
          value: fieldData.value,
          confidence: fieldData.confidence || 0,
        };
      } else {
        console.log(`  ✗ ${field.name}: not found`);
        return {
          name: field.name,
          value: null,
          confidence: 0,
        };
      }
    });
    
    // Build sources
    const sources: SourceAttribution[] = fields
      .filter(f => f.value !== null && f.confidence >= CONFIDENCE_THRESHOLD)
      .map(f => ({
        field: f.name,
        url: 'gemini_knowledge',
        confidence: f.confidence,
      }));
    
    return { fields, sources };
  }

  /**
   * Enrich using Firecrawl fallback
   */
  private async enrichWithFirecrawl(
    websiteUrl: string,
    targetFields: EnrichmentField[],
    recordName: string
  ): Promise<{ fields: FieldWithConfidence[]; sources: SourceAttribution[] }> {
    
    console.log(`[Contact Enrichment] Using Firecrawl for ${recordName}...`);
    
    if (!websiteUrl) {
      throw new Error('No website URL provided');
    }

    try {
      const scraped = await this.firecrawl.scrape({
        url: websiteUrl,
        formats: ['markdown'],
        onlyMainContent: true,
      });
      
      const extracted = await this.gemini3.extractFieldsFromContent(
        scraped.markdown,
        targetFields,
        websiteUrl
      );
      
      const fields: FieldWithConfidence[] = targetFields.map(field => ({
        name: field.name,
        value: extracted.data[field.name] || null,
        confidence: extracted.data[field.name] ? 0.75 : 0,
      }));
      
      const sources: SourceAttribution[] = extracted.sources;
      
      return { fields, sources };
    } catch (error) {
      console.error(`[Contact Enrichment] Firecrawl scrape failed for ${websiteUrl}:`, error);
      throw error;
    }
  }

  /**
   * Build enrichment prompt for Gemini 3
   */
  private buildEnrichmentPrompt(
    context: string,
    targetFields: EnrichmentField[]
  ): string {
    const fieldDescriptions = targetFields
      .map(f => `- ${f.name} (${f.type}): ${f.description}`)
      .join('\n');

    return `以下のレコードについて、指定されたフィールドの情報を推測または検索してください。

**既存のレコード情報:**
${context}

**取得するフィールド:**
${fieldDescriptions}

**指示:**
1. 既存の情報を最大限活用してください
2. 会社名やURLがある場合は、そこから情報を取得してください
3. 各フィールドに confidence スコア (0-1) を付けてください
4. 確信度が低い場合は正直に低いスコアを返してください
5. 情報が見つからない場合は null を返してください
6. 必ずJSON形式で返してください

**出力フォーマット:**
\`\`\`json
{
  "fields": {
    "email": { "value": "info@example.com", "confidence": 0.85 },
    "phone": { "value": "03-1234-5678", "confidence": 0.90 },
    "address": { "value": null, "confidence": 0.30 }
  },
  "reasoning": "推論の根拠"
}
\`\`\`

重要: 必ずJSONのみを返してください。説明文は不要です。`;
  }
}
