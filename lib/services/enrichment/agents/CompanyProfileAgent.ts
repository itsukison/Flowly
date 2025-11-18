/**
 * Company Profile Agent
 * Extracts company profile information (industry, size, description, etc.)
 */

import { AgentBase } from './AgentBase';
import { EnrichmentField, AgentContext, AgentResult } from '../types';

export class CompanyProfileAgent extends AgentBase {
  name = 'CompanyProfileAgent';

  async execute(
    context: AgentContext,
    fields: EnrichmentField[],
    onProgress?: (message: string, type: 'info' | 'success' | 'warning') => void
  ): Promise<AgentResult> {
    const companyName = context.previousResults.company_name || context.previousResults.companyName;

    if (!companyName) {
      this.logProgress('No company name available, using data type for profile search', 'info', onProgress);
    }

    const searchTarget = companyName || context.dataType;
    this.logProgress(`Finding profile for: ${searchTarget}`, 'info', onProgress);

    const searchQueries = this.buildSearchQueries(searchTarget, context);

    try {
      // Single search with reduced limit
      const searchResults = await this.firecrawl.search({
        query: searchQueries[0],
        limit: 1, // Reduced from 3
        lang: 'ja',
      });

      if (searchResults.length === 0) {
        this.logProgress('No profile information found', 'warning', onProgress);
        return {
          agentName: this.name,
          data: {},
          sources: [],
          confidence: 0,
          searchQueries,
        };
      }

      this.logProgress(`Found ${searchResults.length} profile sources`, 'success', onProgress);

      // Use content from search result
      const combinedContent = searchResults[0].content;

      // Extract profile data
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
        `Extracted ${Object.keys(extracted.data).length} profile fields`,
        'success',
        onProgress
      );

      return {
        agentName: this.name,
        data: extracted.data,
        sources: extracted.sources,
        confidence: extracted.confidence,
        searchQueries,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logProgress(`Error: ${errorMessage}`, 'warning', onProgress);
      
      // Check if it's a critical error that should stop the process
      if (errorMessage.includes('Insufficient Firecrawl credits') || 
          errorMessage.includes('API key')) {
        throw error; // Propagate critical errors
      }
      
      return {
        agentName: this.name,
        data: {},
        sources: [],
        confidence: 0,
        searchQueries,
        error: errorMessage,
      };
    }
  }

  /**
   * Build search query for company profile (optimized to single query)
   */
  private buildSearchQueries(target: string, context: AgentContext): string[] {
    // Single optimized query
    if (context.specifications) {
      return [`${target} 会社概要 企業情報 ${context.specifications}`];
    }
    return [`${target} 会社概要 企業情報`];
  }
}
