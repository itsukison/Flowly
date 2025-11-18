/**
 * SerpAPI Service
 * Handles Google search using SerpAPI to find relevant web pages
 */

export interface SerpResult {
  title: string;
  link: string;
  snippet: string;
  position?: number;
}

export interface SerpAPIResponse {
  organic_results?: SerpResult[];
  error?: string;
}

export class SerpAPIService {
  private apiKey: string;
  private baseUrl = 'https://serpapi.com/search.json';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('SerpAPI key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Search Google and return organic results
   */
  async search(query: string, options: {
    num?: number;
    gl?: string; // Country code (e.g., 'jp' for Japan)
    hl?: string; // Language (e.g., 'ja' for Japanese)
  } = {}): Promise<SerpResult[]> {
    const {
      num = 10,
      gl = 'jp',
      hl = 'ja',
    } = options;

    console.log(`\n${'='.repeat(80)}`);
    console.log(`[SerpAPI] Searching Google for: "${query}"`);
    console.log(`[SerpAPI] Results: ${num}, Country: ${gl}, Language: ${hl}`);
    console.log(`${'='.repeat(80)}`);

    try {
      const params = new URLSearchParams({
        q: query,
        api_key: this.apiKey,
        num: num.toString(),
        gl,
        hl,
      });

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`SerpAPI HTTP error: ${response.status} ${response.statusText}`);
      }

      const data: SerpAPIResponse = await response.json();

      if (data.error) {
        throw new Error(`SerpAPI error: ${data.error}`);
      }

      const results = data.organic_results || [];

      console.log(`[SerpAPI] ✓ Found ${results.length} organic results`);
      results.forEach((result, i) => {
        console.log(`\n  Result #${i + 1}:`);
        console.log(`  Title: ${result.title}`);
        console.log(`  URL: ${result.link}`);
        console.log(`  Snippet: ${result.snippet?.substring(0, 100)}...`);
      });
      console.log(`${'='.repeat(80)}\n`);

      return results;

    } catch (error) {
      console.error(`[SerpAPI] ✗ Search failed:`, error);
      console.error(`${'='.repeat(80)}\n`);
      throw error;
    }
  }
}
