/**
 * General Agent
 * Handles custom fields that don't fit into specialized agents
 */

import { AgentBase } from './AgentBase';
import { EnrichmentField, AgentContext, AgentResult } from '../types';

export class GeneralAgent extends AgentBase {
  name = 'GeneralAgent';

  async execute(
    context: AgentContext,
    fields: EnrichmentField[],
    onProgress?: (message: string, type: 'info' | 'success' | 'warning') => void
  ): Promise<AgentResult> {
    this.logProgress(`Handling ${fields.length} custom fields`, 'info', onProgress);

    const companyName = context.previousResults.company_name || context.previousResults.companyName;
    const searchTarget = companyName || context.dataType;

    const allData: Record<string, any> = {};
    const allSources: any[] = [];
    const searchQueries: string[] = [];
    let remainingFields = [...fields];

    // Process each field individually
    for (const field of fields) {
      // Skip if already found in a previous iteration
      if (allData[field.name] !== undefined) {
        continue;
      }

      try {
        this.logProgress(`Searching for: ${field.displayName}`, 'info', onProgress);

        // Generate search queries for this field
        const queries = await this.ai.generateSearchQueries(field, {
          dataType: context.dataType,
          specifications: context.specifications,
          previousData: context.previousResults,
        });

        searchQueries.push(...queries);

        // Single search with reduced limit
        const searchResults = await this.firecrawl.search({
          query: queries[0],
          limit: 1, // Reduced from 2
          lang: 'ja',
        });

        if (searchResults.length === 0) {
          this.logProgress(`No results for ${field.displayName}`, 'warning', onProgress);
          continue;
        }

        // Use content from search result
        const combinedContent = searchResults[0].content;

        // Extract ALL remaining fields from this content (not just the current field)
        const extracted = await this.ai.extractData(
          combinedContent,
          searchResults[0].url,
          remainingFields, // Try to extract all remaining fields
          {
            dataType: context.dataType,
            specifications: context.specifications,
            previousData: context.previousResults,
          }
        );

        // Merge all found data
        Object.assign(allData, extracted.data);
        allSources.push(...extracted.sources);

        // Update remaining fields
        const foundFields = Object.keys(extracted.data);
        remainingFields = remainingFields.filter(f => !foundFields.includes(f.name));

        if (foundFields.length > 1) {
          this.logProgress(
            `Found multiple fields: ${foundFields.join(', ')} ✨`,
            'success',
            onProgress
          );
        } else {
          this.logProgress(`Found ${field.displayName}`, 'success', onProgress);
        }

        // Stop if all fields have been found
        if (remainingFields.length === 0) {
          this.logProgress('All fields found! Stopping search.', 'success', onProgress);
          break;
        }

      } catch (error) {
        this.logProgress(
          `Error extracting ${field.displayName}: ${error instanceof Error ? error.message : 'Unknown'}`,
          'warning',
          onProgress
        );
      }
    }

    const confidence = allSources.length > 0
      ? allSources.reduce((sum, s) => sum + s.confidence, 0) / allSources.length
      : 0;

    this.logProgress(
      `Completed: ${Object.keys(allData).length}/${fields.length} fields extracted`,
      'success',
      onProgress
    );

    return {
      agentName: this.name,
      data: allData,
      sources: allSources,
      confidence,
      searchQueries,
    };
  }
}
