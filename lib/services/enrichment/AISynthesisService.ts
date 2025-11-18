/**
 * AI Synthesis Service
 * Uses Gemini 2.5 Flash for intelligent data extraction from scraped content
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { EnrichmentField, SourceAttribution } from './types';

export interface ExtractionContext {
  dataType: string;
  specifications?: string;
  previousData?: Record<string, any>;
}

export interface ExtractedData {
  data: Record<string, any>;
  sources: SourceAttribution[];
  confidence: number;
}

export class AISynthesisService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent extraction
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });
  }

  /**
   * Extract multiple companies from content (batch discovery)
   */
  async extractMultipleCompanies(
    content: string,
    sourceUrl: string,
    count: number,
    fields: EnrichmentField[],
    context: {
      dataType: string;
      specifications?: string;
    }
  ): Promise<Array<{ data: Record<string, any>; sources: SourceAttribution[] }>> {
    console.log(`\n[AI Synthesis] Extracting ${count} companies from content`);

    const fieldDescriptions = fields
      .map(f => `- ${f.displayName} (${f.name}): ${f.description}`)
      .join('\n');

    const prompt = `あなたはビジネスデータ抽出の専門家です。以下のコンテンツから${count}社の異なる企業情報を抽出してください。

**データタイプ:** ${context.dataType}
${context.specifications ? `**詳細要件:** ${context.specifications}` : ''}

**各企業について以下のフィールドを抽出:**
${fieldDescriptions}

**コンテンツ:**
${content.substring(0, 8000)}

**重要な指示:**
1. コンテンツから${count}社の異なる企業を見つけてください
2. 各企業について、見つかったフィールドを抽出してください
3. **フィールドが見つからない場合はnullを使用してください（企業を除外しないでください）**
4. 企業名だけでも見つかれば、その企業を含めてください
5. ${count}社見つからない場合は、見つかった分だけ返してください
6. 必ずJSONの配列形式で返してください

**出力フォーマット例:**
\`\`\`json
[
  {
    ${fields.map(f => `"${f.name}": ${f.type === 'string' ? '"値またはnull"' : f.type === 'number' ? 'null' : f.type === 'boolean' ? 'null' : 'null'}`).join(',\n    ')}
  }
]
\`\`\`

**例（実際のデータ）:**
\`\`\`json
[
  {
    "company_name": "株式会社イトーヨーカ堂",
    "website": "https://www.itoyokado.co.jp"
  },
  {
    "company_name": "任天堂株式会社",
    "website": "https://www.nintendo.co.jp"
  }
]
\`\`\`

重要: 必ずJSON配列のみを返してください。説明文は不要です。企業が見つかったら必ず配列に含めてください。`;

    try {
      console.log(`[AI Synthesis] Sending prompt to Gemini...`);
      console.log(`[AI Synthesis] Prompt length: ${prompt.length} chars`);
      console.log(`[AI Synthesis] Content preview:`, content.substring(0, 200));
      
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      
      console.log(`[AI Synthesis] Full AI response:`, text);
      
      // Parse JSON response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('[AI Synthesis] No JSON array found in response');
        console.error('[AI Synthesis] Response was:', text);
        return [];
      }

      const companies = JSON.parse(jsonMatch[0]);
      
      console.log(`[AI Synthesis] Parsed ${companies.length} companies:`, JSON.stringify(companies, null, 2));
      
      if (companies.length === 0) {
        console.warn('[AI Synthesis] AI returned empty array - no companies found in content');
        console.warn('[AI Synthesis] This might mean the content does not contain the requested data type');
      }
      
      // Convert to expected format with sources
      return companies.slice(0, count).map((companyData: any) => ({
        data: companyData,
        sources: Object.keys(companyData).map(field => ({
          field,
          url: sourceUrl,
          confidence: 0.8,
        })),
      }));

    } catch (error) {
      console.error('[AI Synthesis] Error extracting multiple companies:', error);
      console.error('[AI Synthesis] Error details:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Extract structured data from content
   */
  async extractData(
    content: string,
    sourceUrl: string,
    fields: EnrichmentField[],
    context: ExtractionContext
  ): Promise<ExtractedData> {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[AI Synthesis] Extracting data from: ${sourceUrl}`);
    console.log(`[AI Synthesis] Fields to extract: ${fields.map(f => f.name).join(', ')}`);
    console.log(`[AI Synthesis] Content length: ${content.length} characters`);
    console.log(`${'='.repeat(80)}`);

    const prompt = this.buildExtractionPrompt(content, fields, context);

    console.log(`\n[AI Synthesis] Prompt preview (first 500 chars):`);
    console.log(`${'-'.repeat(80)}`);
    console.log(prompt.substring(0, 500) + '...');
    console.log(`${'-'.repeat(80)}\n`);

    try {
      console.log(`[AI Synthesis] Calling Gemini API...`);
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      console.log(`\n[AI Synthesis] Raw AI response:`);
      console.log(`${'-'.repeat(80)}`);
      console.log(response);
      console.log(`${'-'.repeat(80)}\n`);

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[AI Synthesis] ✗ No JSON found in AI response');
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      console.log(`[AI Synthesis] Parsed JSON:`, JSON.stringify(parsed, null, 2));

      // Build sources for each extracted field
      const sources: SourceAttribution[] = [];
      const data: Record<string, any> = {};

      fields.forEach(field => {
        if (parsed[field.name] !== undefined && parsed[field.name] !== null) {
          data[field.name] = parsed[field.name];
          const confidence = parsed[`${field.name}_confidence`] || 0.7;
          sources.push({
            field: field.name,
            url: sourceUrl,
            confidence,
          });
          console.log(`  ✓ ${field.name}: ${JSON.stringify(parsed[field.name])} (confidence: ${confidence.toFixed(2)})`);
        } else {
          console.log(`  ✗ ${field.name}: not found`);
        }
      });

      const overallConfidence = parsed.overall_confidence || 0.7;

      console.log(`\n[AI Synthesis] ✓ Extraction complete`);
      console.log(`  Fields extracted: ${Object.keys(data).length}/${fields.length}`);
      console.log(`  Overall confidence: ${overallConfidence.toFixed(2)}`);
      console.log(`  Extracted data:`, JSON.stringify(data, null, 2));
      console.log(`${'='.repeat(80)}\n`);

      return {
        data,
        sources,
        confidence: overallConfidence,
      };

    } catch (error) {
      console.error(`\n[AI Synthesis] ✗ Extraction error:`, error);
      console.error(`${'='.repeat(80)}\n`);
      throw error;
    }
  }

  /**
   * Build extraction prompt for Gemini
   */
  private buildExtractionPrompt(
    content: string,
    fields: EnrichmentField[],
    context: ExtractionContext
  ): string {
    const fieldDescriptions = fields.map(f => 
      `- ${f.name} (${f.type}): ${f.description}`
    ).join('\n');

    const fieldNames = fields.map(f => f.name).join(', ');

    // Truncate content if too long (keep first 4000 chars)
    const truncatedContent = content.length > 4000 
      ? content.substring(0, 4000) + '\n...(truncated)'
      : content;

    return `あなたはビジネスデータ抽出の専門家です。以下のコンテンツから指定されたフィールドの情報を抽出してください。

**コンテキスト:**
- データタイプ: ${context.dataType}
${context.specifications ? `- 詳細要件: ${context.specifications}` : ''}
${context.previousData ? `- 既知の情報: ${JSON.stringify(context.previousData)}` : ''}

**抽出するフィールド:**
${fieldDescriptions}

**コンテンツ:**
${truncatedContent}

**指示:**
1. 各フィールドについて、コンテンツから最も関連性の高い情報を抽出してください
2. 情報が見つからない場合は null を返してください
3. 各フィールドの信頼度スコア (0-1) を ${fieldNames.split(', ').map(n => `${n}_confidence`).join(', ')} として含めてください
4. 全体の信頼度スコアを overall_confidence として含めてください
5. 必ず有効なJSONフォーマットで返してください

**出力フォーマット (JSON):**
\`\`\`json
{
  ${fields.map(f => `"${f.name}": ${f.type === 'string' ? '"値"' : f.type === 'number' ? '0' : f.type === 'boolean' ? 'true' : '[]'},\n  "${f.name}_confidence": 0.8`).join(',\n  ')},
  "overall_confidence": 0.8
}
\`\`\`

重要: 必ずJSONのみを返してください。説明文は不要です。`;
  }

  /**
   * Synthesize results from multiple agents
   */
  async synthesizeResults(
    agentResults: Array<{ data: Record<string, any>; sources: SourceAttribution[] }>,
    fields: EnrichmentField[]
  ): Promise<ExtractedData> {
    console.log(`[AI Synthesis] Synthesizing results from ${agentResults.length} agents`);

    // Merge all data and sources
    const mergedData: Record<string, any> = {};
    const mergedSources: SourceAttribution[] = [];

    agentResults.forEach(result => {
      Object.assign(mergedData, result.data);
      mergedSources.push(...result.sources);
    });

    // Calculate overall confidence
    const confidenceScores = mergedSources.map(s => s.confidence);
    const overallConfidence = confidenceScores.length > 0
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
      : 0.5;

    return {
      data: mergedData,
      sources: mergedSources,
      confidence: overallConfidence,
    };
  }

  /**
   * Generate search queries for a specific field
   */
  async generateSearchQueries(
    field: EnrichmentField,
    context: ExtractionContext
  ): Promise<string[]> {
    const prompt = `あなたは検索クエリ生成の専門家です。

**目的:**
以下の情報を見つけるための効果的な検索クエリを3つ生成してください。

**フィールド:** ${field.displayName} (${field.description})
**データタイプ:** ${context.dataType}
${context.specifications ? `**詳細要件:** ${context.specifications}` : ''}
${context.previousData?.company_name ? `**会社名:** ${context.previousData.company_name}` : ''}

**指示:**
1. 日本語で検索クエリを生成してください
2. 具体的で検索結果が得られやすいクエリにしてください
3. 異なるアプローチの3つのクエリを生成してください
4. JSONフォーマットで返してください

**出力フォーマット:**
\`\`\`json
{
  "queries": ["クエリ1", "クエリ2", "クエリ3"]
}
\`\`\``;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Fallback queries
        return [
          `${context.dataType} ${field.displayName}`,
          `${context.dataType} ${field.name}`,
          `日本 ${context.dataType} ${field.displayName}`,
        ];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.queries || [];

    } catch (error) {
      console.error('[AI Synthesis] Query generation error:', error);
      // Fallback queries
      return [
        `${context.dataType} ${field.displayName}`,
        `${context.dataType} ${field.name}`,
      ];
    }
  }
}
