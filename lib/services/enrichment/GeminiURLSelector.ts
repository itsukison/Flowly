/**
 * Gemini URL Selector
 * Uses Gemini 2.5 Flash to intelligently filter URLs from search results
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { SerpResult } from './SerpAPIService';

export interface URLSelectionContext {
  dataType: string;
  specifications?: string;
  objective: string;
  companyName?: string;
}

export class GeminiURLSelector {
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
        temperature: 0.2, // Low temperature for consistent filtering
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });
  }

  /**
   * Select relevant URLs from SERP results
   */
  async selectRelevantUrls(
    serpResults: SerpResult[],
    context: URLSelectionContext,
    maxUrls: number = 3
  ): Promise<string[]> {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[Gemini URL Selector] Filtering ${serpResults.length} URLs`);
    console.log(`[Gemini URL Selector] Context:`, JSON.stringify(context, null, 2));
    console.log(`${'='.repeat(80)}`);

    if (serpResults.length === 0) {
      console.log(`[Gemini URL Selector] No URLs to filter`);
      return [];
    }

    // Prepare data for Gemini
    const serpData = serpResults.map((r, i) => ({
      index: i + 1,
      title: r.title,
      link: r.link,
      snippet: r.snippet,
    }));

    const prompt = `あなたはURL選択の専門家です。検索結果から最も関連性の高いURLを選択してください。

**タスク:**
以下の検索結果から、指定された情報を含む可能性が最も高いURLを${maxUrls}個選択してください。

**情報のタイプ:** ${context.dataType}
${context.specifications ? `**詳細要件:** ${context.specifications}` : ''}
**目的:** ${context.objective}
${context.companyName ? `**会社名:** ${context.companyName}` : ''}

**検索結果:**
${JSON.stringify(serpData, null, 2)}

**選択基準:**
1. ✅ **含める:**
   - 企業の公式サイト（company websites）
   - 企業情報ページ（会社概要、about us）
   - ビジネスディレクトリ（Diamond, Nikkei, 帝国データバンク）
   - 政府の企業登録データベース
   - LinkedIn企業ページ
   - 信頼できる業界メディア

2. ❌ **除外する:**
   - ブログ記事（blog posts）
   - ニュース記事の一覧ページ
   - ソーシャルメディア（Twitter, Facebook）
   - 広告ページ
   - まとめサイト、キュレーションサイト
   - 個人ブログ

3. **優先順位:**
   - .co.jp または .jp ドメインを優先
   - 企業名が含まれるURLを優先
   - 「会社概要」「企業情報」「about」などのキーワードがあるURLを優先

**出力形式:**
必ずJSON形式で返してください。説明文は不要です。

\`\`\`json
{
  "selected_urls": [
    "https://example.co.jp/company",
    "https://example2.jp/about"
  ],
  "reasoning": "短い理由（optional）"
}
\`\`\`

重要: selected_urls配列には、最大${maxUrls}個のURLを含めてください。`;

    try {
      console.log(`[Gemini URL Selector] Sending prompt to Gemini...`);
      
      // Retry logic for 503 errors (model overload)
      let retries = 5; // Increased from 3 to 5 retries
      let lastError: any;
      let result: any;

      while (retries > 0) {
        try {
          result = await this.model.generateContent(prompt);
          break; // Success, exit retry loop
        } catch (error: any) {
          lastError = error;
          const status = error?.status || error?.response?.status;
          
          if (status === 503) {
            retries--;
            if (retries > 0) {
              // Exponential backoff: 3s, 6s, 12s, 24s
              const waitTime = 3000 * Math.pow(2, 4 - retries);
              console.log(`[Gemini URL Selector] 503 error (model overloaded), retrying in ${waitTime / 1000}s... (${retries} retries left)`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
              console.error(`[Gemini URL Selector] 503 error persists after all retries`);
              throw error;
            }
          } else {
            // Not a 503, throw immediately
            throw error;
          }
        }
      }

      if (!result) {
        throw lastError || new Error('Failed to get response from Gemini');
      }

      const text = result.response.text();

      console.log(`[Gemini URL Selector] Raw response:`, text);

      // Parse JSON response
      let cleaned = text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.split('```')[1];
        if (cleaned.startsWith('json')) {
          cleaned = cleaned.substring(4);
        }
      }
      cleaned = cleaned.trim();

      let selectedUrls: string[] = [];

      try {
        const parsed = JSON.parse(cleaned);
        if (parsed.selected_urls && Array.isArray(parsed.selected_urls)) {
          selectedUrls = parsed.selected_urls;
          if (parsed.reasoning) {
            console.log(`[Gemini URL Selector] Reasoning: ${parsed.reasoning}`);
          }
        }
      } catch (e) {
        // Fallback: extract URLs from text
        console.warn(`[Gemini URL Selector] JSON parse failed, extracting URLs from text`);
        const urlMatches = cleaned.match(/https?:\/\/[^\s"]+/g);
        selectedUrls = urlMatches || [];
      }

      // Clean and validate URLs
      selectedUrls = selectedUrls
        .map(url => url.replace(/[,;]$/, '').trim())
        .filter(url => url.startsWith('http'))
        .slice(0, maxUrls);

      console.log(`[Gemini URL Selector] ✓ Selected ${selectedUrls.length} URLs:`);
      selectedUrls.forEach((url, i) => {
        console.log(`  ${i + 1}. ${url}`);
      });
      console.log(`${'='.repeat(80)}\n`);

      return selectedUrls;

    } catch (error) {
      console.error(`[Gemini URL Selector] ✗ Error:`, error);
      console.error(`${'='.repeat(80)}\n`);
      
      // Fallback: Apply basic pattern-based filtering
      console.log(`[Gemini URL Selector] Fallback: applying pattern-based filtering`);
      
      const filteredUrls = serpResults
        .filter(r => {
          const url = r.link.toLowerCase();
          const title = r.title.toLowerCase();
          
          // Exclude obvious blog/news/article URLs
          if (url.includes('/blog/') || url.includes('/news/') || 
              url.includes('/article/') || url.includes('/pr/') ||
              url.includes('/column/') || url.includes('/media/')) {
            console.log(`  ✗ Excluded (blog/news): ${r.link}`);
            return false;
          }
          
          // Exclude social media
          if (url.includes('twitter.com') || url.includes('facebook.com') ||
              url.includes('linkedin.com') || url.includes('instagram.com')) {
            console.log(`  ✗ Excluded (social media): ${r.link}`);
            return false;
          }
          
          // Prefer .co.jp or .jp domains
          if (!url.includes('.co.jp') && !url.includes('.jp')) {
            console.log(`  ⚠ Non-JP domain (lower priority): ${r.link}`);
            // Don't exclude, but deprioritize
          }
          
          console.log(`  ✓ Accepted: ${r.link}`);
          return true;
        })
        .slice(0, maxUrls)
        .map(r => r.link);

      if (filteredUrls.length > 0) {
        console.log(`[Gemini URL Selector] ✓ Fallback found ${filteredUrls.length} filtered URLs`);
        filteredUrls.forEach((url, i) => {
          console.log(`  ${i + 1}. ${url}`);
        });
        console.log(`${'='.repeat(80)}\n`);
        return filteredUrls;
      }
      
      // Ultimate fallback: return top N URLs
      console.log(`[Gemini URL Selector] Ultimate fallback: returning top ${maxUrls} URLs`);
      return serpResults.slice(0, maxUrls).map(r => r.link);
    }
  }
}
