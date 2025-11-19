/**
 * Gemini 3 Knowledge Agent
 * Generates companies with partial data using Gemini 3's knowledge base
 * Returns instant results with confidence scores
 */

import { Gemini3Service, CompanyWithConfidence } from '../Gemini3Service';
import { EnrichmentField } from '../types';

export type ProgressCallback = (message: string, type: 'info' | 'success' | 'warning') => void;

export class Gemini3KnowledgeAgent {
  private gemini3: Gemini3Service;

  constructor(geminiApiKey: string) {
    this.gemini3 = new Gemini3Service(geminiApiKey);
  }

  /**
   * Generate companies with ALL fields and confidence scores
   * Phase 1: Instant knowledge extraction
   */
  async execute(
    dataType: string,
    specifications: string | undefined,
    count: number,
    fields: EnrichmentField[],
    onProgress?: ProgressCallback
  ): Promise<CompanyWithConfidence[]> {
    
    onProgress?.('Analyzing requirements...', 'info');
    onProgress?.('Generating company suggestions using AI knowledge...', 'info');

    try {
      // Call Gemini 3 with thinking_level: high
      const companies = await this.gemini3.generateCompaniesWithConfidence(
        dataType,
        specifications,
        count,
        fields
      );

      if (companies.length === 0) {
        onProgress?.('No companies found matching criteria', 'warning');
        return [];
      }

      onProgress?.(`Found ${companies.length} companies matching criteria`, 'success');

      // Log confidence breakdown for each company
      for (const company of companies) {
        const highConfFields = company.fields.filter(f => f.confidence >= 0.80).length;
        const totalFields = company.fields.length;
        
        if (highConfFields === totalFields) {
          onProgress?.(
            `${company.name}: All ${totalFields} fields with high confidence ✨`,
            'success'
          );
        } else {
          onProgress?.(
            `${company.name}: ${highConfFields}/${totalFields} fields with high confidence`,
            'info'
          );
        }
      }

      return companies;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onProgress?.(`Knowledge extraction failed: ${errorMessage}`, 'warning');
      
      console.error('[Gemini3KnowledgeAgent] Error:', error);
      throw error;
    }
  }

  /**
   * Helper: Get fields that need enrichment (confidence < 0.80)
   */
  getMissingFields(company: CompanyWithConfidence): string[] {
    return company.fields
      .filter(f => f.confidence < 0.80 || f.value === null)
      .map(f => f.name);
  }

  /**
   * Helper: Get high-confidence fields
   */
  getHighConfidenceFields(company: CompanyWithConfidence): string[] {
    return company.fields
      .filter(f => f.confidence >= 0.80 && f.value !== null)
      .map(f => f.name);
  }
}
