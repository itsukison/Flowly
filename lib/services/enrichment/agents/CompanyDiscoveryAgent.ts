/**
 * Company Discovery Agent
 * Finds company names and basic information from data type description
 * Uses SerpAPI + Gemini filtering for intelligent URL selection
 */

import { AgentBase } from './AgentBase';
import { EnrichmentField, AgentContext, AgentResult, SourceAttribution } from '../types';
import { SerpAPIService } from '../SerpAPIService';
import { GeminiURLSelector } from '../GeminiURLSelector';

export class CompanyDiscoveryAgent extends AgentBase {
  name = 'CompanyDiscoveryAgent';
  private serpApi?: SerpAPIService;
  private urlSelector?: GeminiURLSelector;

  constructor(
    firecrawl: any,
    ai: any,
    serpApiKey?: string,
    geminiApiKey?: string
  ) {
    super(firecrawl, ai);
    
    // Initialize SerpAPI and Gemini URL selector if keys are provided
    if (serpApiKey) {
      this.serpApi = new SerpAPIService(serpApiKey);
    }
    if (geminiApiKey) {
      this.urlSelector = new GeminiURLSelector(geminiApiKey);
    }
  }

  /**
   * Batch discovery: Find multiple companies at once
   * Uses two-phase approach: SerpAPI → Gemini filtering → Firecrawl scrape
   * Extracts ALL requested fields during discovery to minimize redundant scraping
   */
  async discoverBatch(
    dataType: string,
    specifications: string | undefined,
    count: number,
    fields: EnrichmentField[],
    onProgress?: (message: string, type: 'info' | 'success' | 'warning') => void
  ): Promise<Array<{ data: Record<string, any>; sources: SourceAttribution[]; missingFields: string[] }>> {
    this.logProgress(`Batch discovering ${count} companies for: ${dataType}`, 'info', onProgress);

    // Build optimized search query with constraints
    const searchQuery = this.buildSmartSearchQuery(dataType, specifications);
    this.logProgress(`Search query: "${searchQuery}"`, 'info', onProgress);

    try {
      let selectedUrls: string[];

      // Phase 1: Use SerpAPI + Gemini if available, otherwise fallback to Firecrawl
      if (this.serpApi && this.urlSelector) {
        this.logProgress('Using SerpAPI + Gemini URL filtering', 'info', onProgress);
        
        // Step 1: Search Google via SerpAPI
        const serpResults = await this.serpApi.search(searchQuery, {
          num: Math.min(count * 2, 10), // Get 2x results for better filtering
          gl: 'jp',
          hl: 'ja',
        });

        if (serpResults.length === 0) {
          this.logProgress('No Google search results found', 'warning', onProgress);
          return [];
        }

        // Step 2: Use Gemini to filter relevant URLs
        selectedUrls = await this.urlSelector.selectRelevantUrls(
          serpResults,
          {
            dataType,
            specifications,
            objective: '企業名、ウェブサイト、基本情報',
          },
          Math.min(count + 1, 3) // Select slightly more than needed
        );

        if (selectedUrls.length === 0) {
          this.logProgress('No relevant URLs selected by Gemini', 'warning', onProgress);
          return [];
        }

        this.logProgress(
          `Filtered down to ${selectedUrls.length} high-quality URLs`,
          'success',
          onProgress
        );
      } else {
        // Fallback: Use Firecrawl search directly
        this.logProgress('Falling back to Firecrawl search (no SerpAPI/Gemini)', 'info', onProgress);
        
        const searchLimit = count <= 3 ? count : Math.min(count + 2, 10);
        const searchResults = await this.firecrawl.search({
          query: searchQuery,
          limit: searchLimit,
          lang: 'ja',
        });

        if (searchResults.length === 0) {
          this.logProgress('No search results found', 'warning', onProgress);
          return [];
        }

        selectedUrls = searchResults.map((r: any) => r.url);
      }

      // Phase 2: Scrape selected URLs and extract ALL fields
      const companies: Array<{ data: Record<string, any>; sources: SourceAttribution[]; missingFields: string[] }> = [];
      const failedUrls: string[] = [];
      
      for (const url of selectedUrls) {
        // Layer 3 defense: Validate URL before scraping
        if (this.shouldSkipUrl(url)) {
          this.logProgress(`Skipping invalid URL: ${url}`, 'warning', onProgress);
          continue;
        }

        try {
          this.logProgress(`Scraping: ${url}`, 'info', onProgress);
          
          const scraped = await this.firecrawl.scrape({
            url,
            formats: ['markdown'],
            onlyMainContent: true,
          });

          // Validate scraped content quality before AI extraction
          if (this.isErrorPage(scraped.markdown, scraped.metadata)) {
            this.logProgress(`Error page detected, skipping: ${url}`, 'warning', onProgress);
            failedUrls.push(url);
            continue; // Try next URL
          }

          if (!scraped.markdown || scraped.markdown.trim().length === 0) {
            this.logProgress(`Skipping ${url}: Empty content`, 'warning', onProgress);
            failedUrls.push(url);
            continue;
          }

          // Extract ALL requested fields from scraped content (not just company_name)
          this.logProgress(`Extracting all fields from ${url}`, 'info', onProgress);
          const extracted = await this.ai.extractData(
            scraped.markdown,
            url,
            fields, // Extract ALL fields, not just discovery fields
            {
              dataType,
              specifications,
              previousData: {},
            }
          );

          // Only add if we found company name or website
          if (extracted.data.company_name || extracted.data.website) {
            // Calculate missing fields (from user-requested fields only, not discovery fields)
            const userFieldNames = fields
              .filter(f => f.name !== 'company_name' && f.name !== 'website')
              .map(f => f.name);
            
            const missingFields = userFieldNames.filter(
              fieldName => 
                extracted.data[fieldName] === undefined || 
                extracted.data[fieldName] === null
            );

            const foundFieldsCount = fields.length - missingFields.length;
            this.logProgress(
              `Found ${foundFieldsCount}/${fields.length} fields for company: ${extracted.data.company_name || 'Unknown'}`,
              foundFieldsCount > 2 ? 'success' : 'info', // >2 means company + website + at least one user field
              onProgress
            );

            companies.push({
              data: extracted.data,
              sources: extracted.sources,
              missingFields, // Track what's still needed
            });

            // Stop if we have enough companies
            if (companies.length >= count) {
              break;
            }
          } else {
            this.logProgress(`No company info found in ${url}`, 'warning', onProgress);
            failedUrls.push(url);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          this.logProgress(`Failed to scrape ${url}: ${errorMsg}`, 'warning', onProgress);
          failedUrls.push(url);
          // Continue with next URL instead of throwing
        }
      }

      if (failedUrls.length > 0) {
        this.logProgress(
          `Skipped ${failedUrls.length} URL(s) due to errors or empty content`,
          'info',
          onProgress
        );
      }

      this.logProgress(
        `Extracted ${companies.length} companies from batch discovery`,
        'success',
        onProgress
      );

      return companies;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logProgress(`Error: ${errorMessage}`, 'warning', onProgress);
      
      if (errorMessage.includes('Insufficient Firecrawl credits') || 
          errorMessage.includes('API key')) {
        throw error;
      }
      
      return [];
    }
  }

  /**
   * Single company discovery (legacy method for backward compatibility)
   */
  async execute(
    context: AgentContext,
    fields: EnrichmentField[],
    onProgress?: (message: string, type: 'info' | 'success' | 'warning') => void
  ): Promise<AgentResult> {
    this.logProgress(`Discovering company for: ${context.dataType}`, 'info', onProgress);

    const searchQuery = this.buildSmartSearchQuery(context.dataType, context.specifications);

    try {
      // Single optimized search
      const searchResults = await this.firecrawl.search({
        query: searchQuery,
        limit: 2, // Reduced from 3
        lang: 'ja',
      });

      if (searchResults.length === 0) {
        this.logProgress('No search results found', 'warning', onProgress);
        return {
          agentName: this.name,
          data: {},
          sources: [],
          confidence: 0,
          searchQueries: [searchQuery],
        };
      }

      this.logProgress(`Found ${searchResults.length} sources`, 'success', onProgress);

      // Combine content from results
      const combinedContent = searchResults
        .map(r => r.content)
        .join('\n\n---\n\n');

      // Extract data using AI
      const extracted = await this.ai.extractData(
        combinedContent,
        searchResults[0].url,
        fields,
        {
          dataType: context.dataType,
          specifications: context.specifications,
          previousData: context.previousResults,
        }
      );

      this.logProgress(
        `Extracted ${Object.keys(extracted.data).length} fields with confidence ${extracted.confidence.toFixed(2)}`,
        'success',
        onProgress
      );

      return {
        agentName: this.name,
        data: extracted.data,
        sources: extracted.sources,
        confidence: extracted.confidence,
        searchQueries: [searchQuery],
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logProgress(`Error: ${errorMessage}`, 'warning', onProgress);
      
      if (errorMessage.includes('Insufficient Firecrawl credits') || 
          errorMessage.includes('API key')) {
        throw error;
      }
      
      return {
        agentName: this.name,
        data: {},
        sources: [],
        confidence: 0,
        searchQueries: [searchQuery],
        error: errorMessage,
      };
    }
  }

  /**
   * Build smart search query that incorporates constraints
   * Avoids generic "一覧" queries that return blog articles
   */
  private buildSmartSearchQuery(dataType: string, specifications?: string): string {
    // Extract key terms from dataType
    let cleanDataType = dataType;
    
    // Remove verbose phrases about quantity and field requests
    cleanDataType = cleanDataType
      .replace(/を\d+個拾ってきて欲しい/g, '')
      .replace(/を\d+個/g, '')
      .replace(/拾ってきて欲しい/g, '')
      .replace(/の連絡先と従業員数と売り上げ/g, '')
      .replace(/の連絡先/g, '')
      .replace(/と従業員数/g, '')
      .replace(/と売り上げ/g, '')
      .replace(/とGMV/g, '')
      .trim();

    // Extract scale/size constraints
    let sizeConstraint = '';
    if (cleanDataType.includes('スケールがあまり多くない') ||
        cleanDataType.includes('小規模') ||
        specifications?.includes('小規模')) {
      sizeConstraint = '小規模 中小企業';
      cleanDataType = cleanDataType.replace(/スケールがあまり多くない/g, '').trim();
    } else if (cleanDataType.includes('大企業') || specifications?.includes('大企業')) {
      sizeConstraint = '大手企業';
    }

    // Build targeted query:
    // - Use specific domain constraints (.co.jp)
    // - Include size constraints
    // - Avoid generic "一覧" that returns blogs
    // - Target company websites directly
    const parts = [cleanDataType];
    if (sizeConstraint) {
      parts.push(sizeConstraint);
    }
    parts.push('site:.co.jp OR site:.jp');
    parts.push('会社概要');

    return parts.join(' ');
  }

  /**
   * Check if URL should be skipped (Layer 3 defense)
   * Validates URLs before scraping to avoid known problematic patterns
   */
  private shouldSkipUrl(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    
    // Skip blog and news URLs
    const blogPatterns = [
      '/blog/', '/news/', '/article/', '/pr/', 
      '/column/', '/media/', '/press/', '/story/',
      '/post/', '/entry/', '/note/'
    ];
    
    for (const pattern of blogPatterns) {
      if (lowerUrl.includes(pattern)) {
        console.log(`[CompanyDiscoveryAgent] URL contains blog pattern: ${pattern}`);
        return true;
      }
    }
    
    // Skip social media URLs
    const socialPatterns = [
      'twitter.com', 'facebook.com', 'linkedin.com',
      'instagram.com', 'youtube.com', 'tiktok.com'
    ];
    
    for (const pattern of socialPatterns) {
      if (lowerUrl.includes(pattern)) {
        console.log(`[CompanyDiscoveryAgent] URL is social media: ${pattern}`);
        return true;
      }
    }
    
    // Skip job posting sites
    const jobPatterns = [
      'recruit', 'career', 'jobs', '/hiring', '/employment'
    ];
    
    for (const pattern of jobPatterns) {
      if (lowerUrl.includes(pattern)) {
        console.log(`[CompanyDiscoveryAgent] URL is job posting: ${pattern}`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if scraped content is an error page
   * Detects server errors, maintenance pages, and other invalid content
   */
  private isErrorPage(markdown: string, metadata?: any): boolean {
    if (!markdown) return true;

    const content = markdown.toLowerCase();
    const length = markdown.trim().length;

    // Check if content is suspiciously short (likely error page)
    if (length < 200) {
      console.log(`[CompanyDiscoveryAgent] Content too short (${length} chars), likely error page`);
      return true;
    }

    // Check for HTTP error status codes in metadata
    if (metadata?.statusCode && metadata.statusCode >= 400) {
      console.log(`[CompanyDiscoveryAgent] HTTP error status: ${metadata.statusCode}`);
      return true;
    }

    // Check for error keywords in content
    const errorKeywords = [
      'エラー', // エラー
      'error',
      '申し訳', // 申し訳
      '不具合', // 不具合
      'page not found',
      '404',
      '500',
      'internal server error',
      'service unavailable',
      'メンテナンス', // メンテナンス
      'maintenance'
    ];

    for (const keyword of errorKeywords) {
      if (content.includes(keyword)) {
        console.log(`[CompanyDiscoveryAgent] Error keyword detected: ${keyword}`);
        return true;
      }
    }

    return false;
  }
}
