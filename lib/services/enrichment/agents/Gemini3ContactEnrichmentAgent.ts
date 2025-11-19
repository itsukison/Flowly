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
   * Uses Gemini 3 with full context, falls back to Firecrawl if needed
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
      
      onProgress?.(`Enriching ${recordName}...`, 'info');
      
      // Phase 1: Try Gemini 3 with full context
      const enriched = await this.enrichWithGemini3(context, targetFields, record);
      
      // Check confidence for each field
      const lowConfidenceFields = enriched.fields.filter(f => f.confidence < CONFIDENCE_THRESHOLD);
      
      if (lowConfidenceFields.length > 0) {
        const lowConfFieldNames = lowConfidenceFields.map(f => f.name).join(', ');
        onProgress?.(
          `Low confidence for ${lowConfFieldNames}, using Firecrawl fallback...`,
          'warning'
        );
        
        // Phase 2: Fallback to Firecrawl for low-confidence fields
        const fallbackFields = targetFields.filter(f => 
          lowConfidenceFields.some(lf => lf.name === f.name)
        );
        
        const fallbackEnriched = await this.enrichWithFirecrawl(
          record,
          fallbackFields,
          onProgress
        );
        
        // Merge results: Use Firecrawl data for low-confidence fields
        const mergedFields = enriched.fields.map(field => {
          const fallbackField = fallbackEnriched.fields.find(f => f.name === field.name);
          if (fallbackField && fallbackField.value !== null) {
            return fallbackField;
          }
          return field;
        });
        
        return {
          recordId: record.id,
          success: true,
          fields: mergedFields,
          sources: [...enriched.sources, ...fallbackEnriched.sources],
        };
      }
      
      // All fields have high confidence
      onProgress?.(`Successfully enriched ${recordName}`, 'success');
      
      return {
        recordId: record.id,
        success: true,
        fields: enriched.fields,
        sources: enriched.sources,
      };
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Contact Enrichment] Error:`, error);
      onProgress?.(`Failed to enrich ${recordName}: ${errorMsg}`, 'error');
      
      // Try Firecrawl as last resort
      try {
        onProgress?.(`Gemini 3 failed, trying Firecrawl...`, 'warning');
        const fallbackEnriched = await this.enrichWithFirecrawl(
          record,
          targetFields,
          onProgress
        );
        
        return {
          recordId: record.id,
          success: true,
          fields: fallbackEnriched.fields,
          sources: fallbackEnriched.sources,
        };
      } catch (fallbackError) {
        return {
          recordId: record.id,
          success: false,
          fields: targetFields.map(f => ({ name: f.name, value: null, confidence: 0 })),
          sources: [],
          error: errorMsg,
        };
      }
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
    record: TableRecord,
    targetFields: EnrichmentField[],
    onProgress?: ProgressCallback
  ): Promise<{ fields: FieldWithConfidence[]; sources: SourceAttribution[] }> {
    
    console.log(`[Contact Enrichment] Using Firecrawl fallback...`);
    
    // Strategy 1: Try website URL if available
    const data = record.data || {};
    const websiteUrl = data.website || data.url || data.ウェブサイト;
    
    if (websiteUrl) {
      onProgress?.(`Scraping ${websiteUrl}...`, 'info');
      
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
        console.error(`[Contact Enrichment] Firecrawl scrape failed:`, error);
      }
    }
    
    // Strategy 2: Search by company name
    const companyName = record.company || record.name;
    if (companyName) {
      onProgress?.(`Searching for ${companyName}...`, 'info');
      
      try {
        const searchResults = await this.firecrawl.search({
          query: `"${companyName}" (特定商取引法 OR 会社概要 OR 運営者情報)`,
          limit: 1,
        });
        
        if (searchResults.length > 0) {
          const extracted = await this.gemini3.extractFieldsFromContent(
            searchResults[0].markdown,
            targetFields,
            searchResults[0].url
          );
          
          const fields: FieldWithConfidence[] = targetFields.map(field => ({
            name: field.name,
            value: extracted.data[field.name] || null,
            confidence: extracted.data[field.name] ? 0.75 : 0,
          }));
          
          const sources: SourceAttribution[] = extracted.sources;
          
          return { fields, sources };
        }
      } catch (error) {
        console.error(`[Contact Enrichment] Firecrawl search failed:`, error);
      }
    }
    
    // Strategy 3: Give up
    console.log(`[Contact Enrichment] No enrichment source available`);
    
    return {
      fields: targetFields.map(f => ({ name: f.name, value: null, confidence: 0 })),
      sources: [],
    };
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
