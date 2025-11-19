/**
 * Gemini 3 Enrichment Agent
 * Enriches low-confidence fields using URL Context or Firecrawl fallback
 * Phase 2: Targeted enrichment for missing data
 */

import { Gemini3Service, CompanyWithConfidence, FieldWithConfidence } from '../Gemini3Service';
import { FirecrawlService } from '../FirecrawlService';
import { EnrichmentField, SourceAttribution } from '../types';

export type ProgressCallback = (message: string, type: 'info' | 'success' | 'warning') => void;

export interface EnrichedCompany {
  name: string;
  website: string;
  fields: FieldWithConfidence[];
  sources: SourceAttribution[];
}

export class Gemini3EnrichmentAgent {
  private gemini3: Gemini3Service;
  private firecrawl: FirecrawlService;

  constructor(geminiApiKey: string, firecrawlApiKey: string) {
    this.gemini3 = new Gemini3Service(geminiApiKey);
    this.firecrawl = new FirecrawlService(firecrawlApiKey);
  }

  /**
   * Enrich a company's low-confidence fields
   * Uses URL Context (primary) or Firecrawl (fallback)
   */
  async execute(
    company: CompanyWithConfidence,
    allFields: EnrichmentField[],
    onProgress?: ProgressCallback
  ): Promise<EnrichedCompany> {
    
    // Get fields that need enrichment (confidence < 0.80)
    const missingFieldNames = company.fields
      .filter(f => f.confidence < 0.80 || f.value === null)
      .map(f => f.name);

    if (missingFieldNames.length === 0) {
      onProgress?.(`${company.name}: No enrichment needed`, 'success');
      return {
        name: company.name,
        website: company.website,
        fields: company.fields,
        sources: this.buildSourcesFromFields(company),
      };
    }

    const missingFields = allFields.filter(f => missingFieldNames.includes(f.name));

    onProgress?.(
      `Enriching ${company.name}: ${missingFieldNames.join(', ')}`,
      'info'
    );

    try {
      // Primary: Use Gemini 3's URL Context tool
      onProgress?.(`Fetching ${company.website}...`, 'info');
      
      const enriched = await this.gemini3.enrichMissingFields(
        company.name,
        company.website,
        missingFields
      );

      // Update fields with enriched data
      const updatedFields = company.fields.map(field => {
        if (enriched.data[field.name] !== undefined && enriched.data[field.name] !== null) {
          onProgress?.(`Extracted ${field.name} ✓`, 'success');
          return {
            name: field.name,
            value: enriched.data[field.name],
            confidence: 0.85, // URL Context confidence
          };
        }
        return field;
      });

      return {
        name: company.name,
        website: company.website,
        fields: updatedFields,
        sources: [...this.buildSourcesFromFields(company), ...enriched.sources],
      };

    } catch (error) {
      // Fallback: Use Firecrawl
      onProgress?.(`URL Context failed, using Firecrawl fallback...`, 'warning');
      
      try {
        const scraped = await this.firecrawl.scrape({
          url: company.website,
          formats: ['markdown'],
          onlyMainContent: true,
        });

        const enriched = await this.gemini3.extractFieldsFromContent(
          scraped.markdown,
          missingFields,
          company.website
        );

        // Update fields with enriched data
        const updatedFields = company.fields.map(field => {
          if (enriched.data[field.name] !== undefined && enriched.data[field.name] !== null) {
            onProgress?.(`Extracted ${field.name} ✓`, 'success');
            return {
              name: field.name,
              value: enriched.data[field.name],
              confidence: 0.75, // Fallback confidence
            };
          }
          return field;
        });

        return {
          name: company.name,
          website: company.website,
          fields: updatedFields,
          sources: [...this.buildSourcesFromFields(company), ...enriched.sources],
        };

      } catch (fallbackError) {
        const errorMsg = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
        onProgress?.(`Enrichment failed for ${company.name}: ${errorMsg}`, 'warning');
        
        // Return original company data even if enrichment fails
        return {
          name: company.name,
          website: company.website,
          fields: company.fields,
          sources: this.buildSourcesFromFields(company),
        };
      }
    }
  }

  /**
   * Build sources from company fields
   */
  private buildSourcesFromFields(company: CompanyWithConfidence): SourceAttribution[] {
    return company.fields
      .filter(f => f.value !== null && f.confidence >= 0.80)
      .map(f => ({
        field: f.name,
        url: f.confidence >= 0.80 ? 'gemini_knowledge' : company.website,
        confidence: f.confidence,
      }));
  }
}
