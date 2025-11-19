/**
 * Gemini 3 Pro Service
 * Unified service for Gemini 3 Pro interactions with hybrid knowledge + enrichment approach
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { EnrichmentField, SourceAttribution } from './types';

export interface FieldWithConfidence {
  name: string;
  value: any;
  confidence: number;
}

export interface CompanyWithConfidence {
  name: string;
  website: string;
  fields: FieldWithConfidence[];
}

export interface ExtractedData {
  data: Record<string, any>;
  sources: SourceAttribution[];
  confidence: number;
}

export class Gemini3Service {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-3-pro-preview',
      generationConfig: {
        temperature: 1.0, // Keep at default for Gemini 3
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });
  }

  /**
   * Generate companies with ALL fields and confidence scores
   * Uses thinking_level: "high" for better reasoning
   * Returns partial data instantly - only high-confidence fields are filled
   */
  async generateCompaniesWithConfidence(
    dataType: string,
    specifications: string | undefined,
    count: number,
    fields: EnrichmentField[]
  ): Promise<CompanyWithConfidence[]> {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[Gemini 3 Knowledge] Generating ${count} companies`);
    console.log(`[Gemini 3 Knowledge] Data type: ${dataType}`);
    console.log(`[Gemini 3 Knowledge] Fields: ${fields.map(f => f.name).join(', ')}`);
    console.log(`${'='.repeat(80)}`);

    const prompt = this.buildKnowledgeExtractionPrompt(dataType, specifications, count, fields);

    try {
      console.log(`[Gemini 3 Knowledge] Calling Gemini 3 Pro with thinking_level: high...`);

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          ...this.model.generationConfig,
          thinkingConfig: {
            thinkingLevel: 'high', // Maximize reasoning depth
          },
        },
      });

      const text = result.response.text();
      console.log(`[Gemini 3 Knowledge] Raw response:`, text.substring(0, 500));

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[Gemini 3 Knowledge] No JSON found in response');
        throw new Error('No JSON found in Gemini 3 response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.companies || !Array.isArray(parsed.companies)) {
        console.error('[Gemini 3 Knowledge] Invalid response format');
        throw new Error('Invalid response format from Gemini 3');
      }

      const companies: CompanyWithConfidence[] = parsed.companies.map((company: any) => {
        const companyFields: FieldWithConfidence[] = [];

        // Extract each field with confidence
        for (const field of fields) {
          let fieldData = company.fields?.[field.name];

          // Fallback: Try case-insensitive match if exact match fails
          if (!fieldData && company.fields) {
            const matchingKey = Object.keys(company.fields).find(
              k => k.toLowerCase() === field.name.toLowerCase()
            );
            if (matchingKey) {
              fieldData = company.fields[matchingKey];
            }
          }

          if (fieldData && typeof fieldData === 'object') {
            companyFields.push({
              name: field.name,
              value: fieldData.value,
              confidence: fieldData.confidence || 0,
            });
          } else {
            console.warn(`[Gemini 3 Knowledge] Field "${field.name}" not found in response for ${company.name}. Available keys: ${Object.keys(company.fields || {}).join(', ')}`);
            // Field not provided or invalid format
            companyFields.push({
              name: field.name,
              value: null,
              confidence: 0,
            });
          }
        }

        return {
          name: company.name,
          website: company.website,
          fields: companyFields,
        };
      });

      // Log confidence breakdown
      console.log(`\n[Gemini 3 Knowledge] Generated ${companies.length} companies:`);
      companies.forEach((company, i) => {
        const highConfFields = company.fields.filter(f => f.confidence >= 0.80).length;
        const totalFields = company.fields.length;
        console.log(`  ${i + 1}. ${company.name}: ${highConfFields}/${totalFields} high-confidence fields`);
      });
      console.log(`${'='.repeat(80)}\n`);

      return companies;

    } catch (error) {
      console.error(`[Gemini 3 Knowledge] Error:`, error);
      throw error;
    }
  }

  /**
   * Enrich missing fields using URL Context tool
   * Uses thinking_level: "low" for faster extraction
   */
  async enrichMissingFields(
    companyName: string,
    websiteUrl: string,
    missingFields: EnrichmentField[]
  ): Promise<ExtractedData> {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[Gemini 3 Enrichment] Enriching ${companyName}`);
    console.log(`[Gemini 3 Enrichment] URL: ${websiteUrl}`);
    console.log(`[Gemini 3 Enrichment] Missing fields: ${missingFields.map(f => f.name).join(', ')}`);
    console.log(`${'='.repeat(80)}`);

    const prompt = this.buildEnrichmentPrompt(companyName, websiteUrl, missingFields);

    try {
      console.log(`[Gemini 3 Enrichment] Calling Gemini 3 Pro with URL Context tool...`);

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          ...this.model.generationConfig,
          thinkingConfig: {
            thinkingLevel: 'low', // Minimize latency
          },
        },
        tools: [
          { urlContext: {} }, // Built-in URL fetching
        ],
      });

      const text = result.response.text();
      console.log(`[Gemini 3 Enrichment] Raw response:`, text.substring(0, 500));

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[Gemini 3 Enrichment] No JSON found in response');
        throw new Error('No JSON found in enrichment response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Build extracted data
      const data: Record<string, any> = {};
      const sources: SourceAttribution[] = [];

      for (const field of missingFields) {
        if (parsed[field.name] !== undefined && parsed[field.name] !== null) {
          data[field.name] = parsed[field.name];
          sources.push({
            field: field.name,
            url: parsed.sources?.[field.name] || websiteUrl,
            confidence: 0.85, // URL Context enrichment confidence
          });
          console.log(`  ✓ ${field.name}: ${JSON.stringify(parsed[field.name])}`);
        } else {
          console.log(`  ✗ ${field.name}: not found`);
        }
      }

      console.log(`[Gemini 3 Enrichment] Extracted ${Object.keys(data).length}/${missingFields.length} fields`);
      console.log(`${'='.repeat(80)}\n`);

      return {
        data,
        sources,
        confidence: 0.85,
      };

    } catch (error) {
      console.error(`[Gemini 3 Enrichment] Error:`, error);
      throw error;
    }
  }

  /**
   * Fallback: Extract fields from Firecrawl content
   * Used when URL Context fails
   */
  async extractFieldsFromContent(
    content: string,
    fields: EnrichmentField[],
    sourceUrl: string
  ): Promise<ExtractedData> {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[Gemini 3 Fallback] Extracting from scraped content`);
    console.log(`[Gemini 3 Fallback] Fields: ${fields.map(f => f.name).join(', ')}`);
    console.log(`${'='.repeat(80)}`);

    const prompt = this.buildFallbackExtractionPrompt(content, fields);

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          ...this.model.generationConfig,
          thinkingConfig: {
            thinkingLevel: 'low',
          },
        },
      });

      const text = result.response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in fallback response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Build extracted data
      const data: Record<string, any> = {};
      const sources: SourceAttribution[] = [];

      for (const field of fields) {
        if (parsed[field.name] !== undefined && parsed[field.name] !== null) {
          data[field.name] = parsed[field.name];
          sources.push({
            field: field.name,
            url: sourceUrl,
            confidence: 0.75, // Fallback confidence
          });
        }
      }

      console.log(`[Gemini 3 Fallback] Extracted ${Object.keys(data).length}/${fields.length} fields`);
      console.log(`${'='.repeat(80)}\n`);

      return {
        data,
        sources,
        confidence: 0.75,
      };

    } catch (error) {
      console.error(`[Gemini 3 Fallback] Error:`, error);
      throw error;
    }
  }

  /**
   * Build knowledge extraction prompt
   */
  private buildKnowledgeExtractionPrompt(
    dataType: string,
    specifications: string | undefined,
    count: number,
    fields: EnrichmentField[]
  ): string {
    const fieldDescriptions = fields
      .map(f => `- ${f.name} (${f.type}): ${f.description}`)
      .join('\n');

    return `あなたは日本のビジネスデータの専門家です。以下の条件に合う企業を${count}社提案し、各企業について全てのフィールドを埋めてください。

**重要: 確信度が高い情報のみを提供してください。不確かな情報は null にしてください。**

**条件:**
- データタイプ: ${dataType}
${specifications ? `- 詳細要件: ${specifications}` : ''}

**抽出するフィールド:**
${fieldDescriptions}

**指示:**
1. 実在する企業のみを提案してください
2. 各フィールドについて、あなたの知識に基づいて値を提供してください
3. **確信度が80%未満の場合は null を返してください**
4. 各フィールドに confidence スコア (0-1) を付けてください
5. 必ずJSON形式で返してください

**出力フォーマット:**
\`\`\`json
{
  "companies": [
    {
      "name": "BASE株式会社",
      "website": "https://binc.jp",
      "fields": {
        "company_name": { "value": "BASE株式会社", "confidence": 0.95 },
        "website": { "value": "https://binc.jp", "confidence": 0.90 },
        "industry": { "value": "Eコマースプラットフォーム", "confidence": 0.85 },
        "email": { "value": null, "confidence": 0.30 },
        "employee_count": { "value": null, "confidence": 0.40 }
      }
    }
  ],
  "reasoning": "選定理由と確信度の根拠"
}
\`\`\`

重要: 
- 確信度 >= 0.80 の情報のみ値を提供
- 確信度 < 0.80 の場合は null を返す
- 推測や憶測は避ける
- 必ずJSONのみを返してください。説明文は不要です。`;
  }

  /**
   * Build enrichment prompt with URL Context
   */
  private buildEnrichmentPrompt(
    companyName: string,
    websiteUrl: string,
    missingFields: EnrichmentField[]
  ): string {
    const fieldDescriptions = missingFields
      .map(f => `- ${f.name} (${f.type}): ${f.description}`)
      .join('\n');

    return `以下の企業について、指定されたフィールドの情報を公式ウェブサイトから抽出してください。

**企業情報:**
- 企業名: ${companyName}
- ウェブサイト: ${websiteUrl}

**抽出するフィールド:**
${fieldDescriptions}

**指示:**
1. 公式ウェブサイトから最新の情報を取得してください
2. 各フィールドについて、見つかった情報を抽出してください
3. 情報が見つからない場合は null を返してください
4. 必ずJSON形式で返してください

**出力フォーマット:**
\`\`\`json
{
  ${missingFields.map(f => `"${f.name}": "値またはnull"`).join(',\n  ')},
  "sources": {
    ${missingFields.map(f => `"${f.name}": "情報源のURL"`).join(',\n    ')}
  }
}
\`\`\`

重要: ウェブサイトから確認できた情報のみを返してください。必ずJSONのみを返してください。`;
  }

  /**
   * Build fallback extraction prompt
   */
  private buildFallbackExtractionPrompt(
    content: string,
    fields: EnrichmentField[]
  ): string {
    const fieldDescriptions = fields
      .map(f => `- ${f.name} (${f.type}): ${f.description}`)
      .join('\n');

    const truncatedContent = content.length > 6000
      ? content.substring(0, 6000) + '\n...(truncated)'
      : content;

    return `以下のコンテンツから指定されたフィールドの情報を抽出してください。

**抽出するフィールド:**
${fieldDescriptions}

**コンテンツ:**
${truncatedContent}

**指示:**
1. 各フィールドについて、コンテンツから情報を抽出してください
2. 情報が見つからない場合は null を返してください
3. 必ずJSON形式で返してください

**出力フォーマット:**
\`\`\`json
{
  ${fields.map(f => `"${f.name}": "値またはnull"`).join(',\n  ')}
}
\`\`\`

重要: 必ずJSONのみを返してください。`;
  }
}
