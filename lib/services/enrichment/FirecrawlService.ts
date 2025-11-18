/**
 * Firecrawl Service
 * Handles web scraping and search functionality using Firecrawl API
 */

import FirecrawlApp from '@mendable/firecrawl-js';
import { SearchResult, ScrapedContent } from './types';

export interface FirecrawlSearchOptions {
  query: string;
  limit?: number;
  lang?: string;
}

export interface FirecrawlScrapeOptions {
  url: string;
  formats?: ('markdown' | 'html' | 'rawHtml')[];
  onlyMainContent?: boolean;
}

export class FirecrawlService {
  private app: FirecrawlApp;
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 12000; // 12 seconds between requests (free tier: 6 req/min = 1 per 10s, adding buffer)
  private requestTimestamps: number[] = []; // Track requests in the last minute

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Firecrawl API key is required');
    }
    this.app = new FirecrawlApp({ apiKey });
  }

  /**
   * Rate limiting helper - respects free tier limits (6 requests per minute)
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(ts => ts > oneMinuteAgo);
    
    // If we've made 6 requests in the last minute, wait
    if (this.requestTimestamps.length >= 6) {
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = 60000 - (now - oldestRequest) + 1000; // Wait until oldest request is >1 min old, plus 1s buffer
      console.log(`[Firecrawl] Rate limit: waiting ${Math.ceil(waitTime / 1000)}s before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Also ensure minimum interval between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`[Firecrawl] Minimum interval: waiting ${Math.ceil(waitTime / 1000)}s`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
    this.requestTimestamps.push(this.lastRequestTime);
    this.requestCount++;
  }

  /**
   * Retry helper for rate limit and server errors
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    context: string = 'operation'
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        const statusCode = error?.statusCode || error?.status;
        const errorCode = error?.code;
        
        // Check if it's a retryable error
        const isRateLimitError = statusCode === 429;
        const isServerError = statusCode >= 500 && statusCode < 600;
        const isCreditError = statusCode === 402;
        const isTimeoutError = errorCode === 'ETIMEDOUT' || errorCode === 'ESOCKETTIMEDOUT' || error?.message?.includes('timeout');
        
        if (isCreditError) {
          throw new Error('Insufficient Firecrawl credits. Please upgrade your plan at https://firecrawl.dev/pricing');
        }
        
        // Don't retry timeout errors - they waste credits
        if (isTimeoutError) {
          console.error(`[Firecrawl] Timeout error for ${context} - not retrying to avoid wasting credits`);
          throw error;
        }
        
        if (!isRateLimitError && !isServerError) {
          throw error; // Don't retry non-retryable errors
        }
        
        if (attempt < maxRetries - 1) {
          // Calculate wait time
          let waitTime: number;
          if (isRateLimitError) {
            // For rate limits, wait 60 seconds
            waitTime = 60000;
            console.log(`[Firecrawl] Rate limit hit for ${context}, waiting 60s before retry ${attempt + 1}/${maxRetries}`);
          } else {
            // For server errors, exponential backoff
            waitTime = Math.min(1000 * Math.pow(2, attempt), 30000);
            console.log(`[Firecrawl] Server error for ${context}, waiting ${waitTime / 1000}s before retry ${attempt + 1}/${maxRetries}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Search the web using Firecrawl
   */
  async search(options: FirecrawlSearchOptions): Promise<SearchResult[]> {
    const { query, limit = 3, lang = 'ja' } = options;

    console.log(`\n${'='.repeat(80)}`);
    console.log(`[Firecrawl Search] Query: "${query}"`);
    console.log(`[Firecrawl Search] Limit: ${limit}, Language: ${lang}`);
    console.log(`${'='.repeat(80)}`);

    return this.retryWithBackoff(async () => {
      await this.rateLimit();

      const searchOptions: Record<string, unknown> = { 
        limit,
        lang,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true,
        },
      };

      console.log(`[Firecrawl Search] Search options:`, JSON.stringify(searchOptions, null, 2));

      const result = await this.app.search(query, searchOptions);

      // Handle both old and new API response formats
      let data: any[];
      if ('success' in result && 'data' in result) {
        // Old API format: { success: boolean, data: [] }
        if (!result.success || !result.data) {
          console.error('[Firecrawl Search] No results returned:', result);
          throw new Error('Firecrawl search returned no results');
        }
        data = result.data as any[];
      } else {
        // New API format: { web?: [], news?: [], images?: [] }
        const searchData = result as any;
        data = [...(searchData.web || []), ...(searchData.news || []), ...(searchData.images || [])];
        if (data.length === 0) {
          console.error('[Firecrawl Search] No results returned:', result);
          throw new Error('Firecrawl search returned no results');
        }
      }

      const results: SearchResult[] = data.map((item: any, index: number) => {
        const searchResult = {
          url: item.url || '',
          title: item.title || item.metadata?.title || item.url || '',
          content: item.markdown || item.content || '',
          markdown: item.markdown,
        };

        console.log(`\n[Firecrawl Search] Result #${index + 1}:`);
        console.log(`  URL: ${searchResult.url}`);
        console.log(`  Title: ${searchResult.title}`);
        console.log(`  Content length: ${searchResult.content.length} characters`);
        console.log(`  Content preview (first 300 chars):`);
        console.log(`  ${'-'.repeat(76)}`);
        console.log(`  ${searchResult.content.substring(0, 300)}${searchResult.content.length > 300 ? '...' : ''}`);
        console.log(`  ${'-'.repeat(76)}`);

        return searchResult;
      });

      console.log(`\n[Firecrawl Search] ✓ Found ${results.length} results for "${query}"`);
      console.log(`${'='.repeat(80)}\n`);
      
      return results;
    }, 3, `search "${query}"`).catch(error => {
      console.error(`\n[Firecrawl Search] ✗ Error for "${query}":`, error);
      const errorWithStatus = error as { statusCode?: number; message?: string };
      if (errorWithStatus?.statusCode) {
        console.error(`[Firecrawl Search] Status code: ${errorWithStatus.statusCode}`);
      }
      console.error(`${'='.repeat(80)}\n`);
      throw error;
    });
  }

  /**
   * Scrape a specific URL using Firecrawl
   */
  async scrape(options: FirecrawlScrapeOptions): Promise<ScrapedContent> {
    const { url, formats = ['markdown'], onlyMainContent = true } = options;

    console.log(`\n${'='.repeat(80)}`);
    console.log(`[Firecrawl Scrape] URL: ${url}`);
    console.log(`[Firecrawl Scrape] Formats: ${formats.join(', ')}, Main content only: ${onlyMainContent}`);
    console.log(`${'='.repeat(80)}`);

    return this.retryWithBackoff(async () => {
      await this.rateLimit();

      const scrapeOptions = {
        formats,
        onlyMainContent,
      };

      console.log(`[Firecrawl Scrape] Scrape options:`, JSON.stringify(scrapeOptions, null, 2));

      const result = await this.app.scrape(url, scrapeOptions) as any;

      // Handle various response formats and failure cases
      if (!result) {
        console.error('[Firecrawl Scrape] Scrape returned null/undefined');
        throw new Error('Firecrawl scrape returned no response');
      }

      // Check if scrape was explicitly unsuccessful
      if (result.success === false) {
        const errorMsg = result.error || result.message || 'Scrape failed without error message';
        console.error('[Firecrawl Scrape] Scrape failed:', errorMsg);
        throw new Error(`Firecrawl scrape failed: ${errorMsg}`);
      }

      // Extract content - handle different response structures
      const markdown = result.markdown || result.data?.markdown || result.content || '';
      const html = result.html || result.data?.html;
      const metadata = result.metadata || result.data?.metadata || {};

      // If no content at all, throw error
      if (!markdown && !html) {
        console.error('[Firecrawl Scrape] No content extracted (no markdown or html)');
        throw new Error('Firecrawl scrape returned no content (empty markdown and html)');
      }

      // The result itself contains the scraped data (not in a nested data field)
      const scrapedContent: ScrapedContent = {
        url: result.url || url,
        markdown,
        html,
        metadata,
      };

      console.log(`\n[Firecrawl Scrape] ✓ Successfully scraped ${url}`);
      console.log(`  Markdown length: ${scrapedContent.markdown.length} characters`);
      console.log(`  Metadata:`, scrapedContent.metadata);
      console.log(`  Content preview (first 500 chars):`);
      console.log(`  ${'-'.repeat(76)}`);
      console.log(`  ${scrapedContent.markdown.substring(0, 500)}${scrapedContent.markdown.length > 500 ? '...' : ''}`);
      console.log(`  ${'-'.repeat(76)}`);
      console.log(`${'='.repeat(80)}\n`);

      return scrapedContent;
    }, 3, `scrape ${url}`).catch(error => {
      console.error(`\n[Firecrawl Scrape] ✗ Error scraping ${url}:`, error);
      const errorWithStatus = error as { statusCode?: number; message?: string };
      if (errorWithStatus?.statusCode) {
        console.error(`[Firecrawl Scrape] Status code: ${errorWithStatus.statusCode}`);
      }
      console.error(`${'='.repeat(80)}\n`);
      throw error;
    });
  }

  /**
   * Get request statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
    };
  }
}
