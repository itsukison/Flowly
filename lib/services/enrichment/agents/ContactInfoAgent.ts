/**
 * Contact Info Agent
 * Extracts contact information (email, phone, address) for companies
 */

import { AgentBase } from './AgentBase';
import { EnrichmentField, AgentContext, AgentResult } from '../types';

export class ContactInfoAgent extends AgentBase {
  name = 'ContactInfoAgent';

  async execute(
    context: AgentContext,
    fields: EnrichmentField[],
    onProgress?: (message: string, type: 'info' | 'success' | 'warning') => void
  ): Promise<AgentResult> {
    const companyName = context.previousResults.company_name || context.previousResults.companyName;

    if (!companyName) {
      this.logProgress('No company name available, skipping contact info extraction', 'warning', onProgress);
      return {
        agentName: this.name,
        data: {},
        sources: [],
        confidence: 0,
      };
    }

    this.logProgress(`Finding contact info for: ${companyName}`, 'info', onProgress);

    const searchQueries = this.buildSearchQueries(companyName, context);

    try {
      // Single search with reduced limit
      const searchResults = await this.firecrawl.search({
        query: searchQueries[0],
        limit: 1, // Reduced from 2
        lang: 'ja',
      });

      if (searchResults.length === 0) {
        this.logProgress('No contact information found', 'warning', onProgress);
        return {
          agentName: this.name,
          data: {},
          sources: [],
          confidence: 0,
          searchQueries,
        };
      }

      this.logProgress(`Found ${searchResults.length} potential sources`, 'success', onProgress);

      // Use content from search result
      const combinedContent = searchResults[0].content;

      // Extract contact data
      const extracted = await this.ai.extractData(
        combinedContent,
        searchResults[0].url,
        fields,
        {
          dataType: context.dataType,
          specifications: context.specifications,
          previousData: { ...context.previousResults, company_name: companyName },
        }
      );

      this.logProgress(
        `Extracted ${Object.keys(extracted.data).length} contact fields`,
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
   * Build search query for contact information (optimized to single query)
   */
  private buildSearchQueries(companyName: string, context: AgentContext): string[] {
    // Single optimized query instead of 3
    return [`${companyName} 連絡先 会社概要`];
  }
}
