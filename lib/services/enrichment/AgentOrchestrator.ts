/**
 * Agent Orchestrator
 * Coordinates multiple specialized agents to generate complete records
 */

import { FirecrawlService } from './FirecrawlService';
import { AISynthesisService } from './AISynthesisService';
import { CompanyDiscoveryAgent } from './agents/CompanyDiscoveryAgent';
import { ContactInfoAgent } from './agents/ContactInfoAgent';
import { CompanyProfileAgent } from './agents/CompanyProfileAgent';
import { GeneralAgent } from './agents/GeneralAgent';
import { EnrichmentField, AgentContext, GeneratedRecord, SourceAttribution } from './types';

export class AgentOrchestrator {
  private firecrawl: FirecrawlService;
  private ai: AISynthesisService;
  private discoveryAgent: CompanyDiscoveryAgent;
  private contactAgent: ContactInfoAgent;
  private profileAgent: CompanyProfileAgent;
  private generalAgent: GeneralAgent;

  constructor(
    firecrawlApiKey: string,
    geminiApiKey: string,
    serpApiKey?: string
  ) {
    this.firecrawl = new FirecrawlService(firecrawlApiKey);
    this.ai = new AISynthesisService(geminiApiKey);

    // Initialize agents - pass SerpAPI key to discovery agent
    this.discoveryAgent = new CompanyDiscoveryAgent(
      this.firecrawl,
      this.ai,
      serpApiKey,
      geminiApiKey
    );
    this.contactAgent = new ContactInfoAgent(this.firecrawl, this.ai);
    this.profileAgent = new CompanyProfileAgent(this.firecrawl, this.ai);
    this.generalAgent = new GeneralAgent(this.firecrawl, this.ai);
  }

  /**
   * Generate multiple records using batch discovery (OPTIMIZED)
   * Discovery extracts ALL fields at once, subsequent agents only fill missing data
   */
  async generateRecordsBatch(
    count: number,
    dataType: string,
    specifications: string | undefined,
    fields: EnrichmentField[],
    onProgress?: (message: string, type: 'info' | 'success' | 'warning') => void
  ): Promise<GeneratedRecord[]> {
    console.log(`[Orchestrator] Batch generating ${count} records`);

    try {
      // Phase 1: Batch Discovery (always include discovery fields + user fields)
      if (onProgress) onProgress(`Phase 1: Discovering ${count} companies and extracting all available data...`, 'info');

      // Always include company_name and website in discovery
      const discoveryFields: EnrichmentField[] = [
        {
          name: 'company_name',
          displayName: '会社名',
          description: '企業の正式名称',
          type: 'string',
          required: true,
        },
        {
          name: 'website',
          displayName: 'ウェブサイト',
          description: '企業の公式ウェブサイトURL',
          type: 'string',
          required: false,
        },
      ];

      // Merge discovery fields with user fields (avoid duplicates)
      const allFields = [
        ...discoveryFields,
        ...fields.filter(f => f.name !== 'company_name' && f.name !== 'website')
      ];

      const discoveredCompanies = await this.discoveryAgent.discoverBatch(
        dataType,
        specifications,
        count,
        allFields, // Extract discovery fields + user fields
        onProgress
      );

      if (discoveredCompanies.length === 0) {
        if (onProgress) onProgress(`No companies found`, 'warning');
        return [];
      }

      if (onProgress) {
        onProgress(
          `Found ${discoveredCompanies.length} companies, enriching missing data...`,
          'success'
        );
      }

      // Phase 2-4: Enrich each discovered company (only for missing fields)
      const records: GeneratedRecord[] = [];

      for (let i = 0; i < discoveredCompanies.length; i++) {
        const company = discoveredCompanies[i];
        
        if (onProgress) {
          onProgress(
            `Enriching company ${i + 1}/${discoveredCompanies.length}: ${company.data.company_name || company.data.name || 'Unknown'}`,
            'info'
          );
        }

        try {
          // Build context with discovered company data
          const context: AgentContext = {
            dataType,
            specifications,
            previousResults: company.data,
            recordIndex: i,
          };

          const allData: Record<string, any> = { ...company.data };
          const allSources: SourceAttribution[] = [...company.sources];

          // Get remaining fields that need to be extracted
          const remainingFields = fields.filter(f => company.missingFields.includes(f.name));

          if (remainingFields.length === 0) {
            if (onProgress) {
              onProgress(
                `Company ${i + 1}: All fields found during discovery! ✨`,
                'success'
              );
            }
          } else {
            if (onProgress) {
              onProgress(
                `Company ${i + 1}: ${remainingFields.length} fields still needed: ${remainingFields.map(f => f.name).join(', ')}`,
                'info'
              );
            }

            // Categorize only the missing fields
            const fieldCategories = this.categorizeFields(remainingFields);

            // Phase 2: Contact Info (if needed)
            if (fieldCategories.contact.length > 0) {
              if (onProgress) onProgress(`Searching for contact info...`, 'info');
              const contactResult = await this.contactAgent.execute(
                context,
                [...fieldCategories.contact, ...remainingFields], // Pass ALL remaining fields
                onProgress
              );
              Object.assign(allData, contactResult.data);
              allSources.push(...contactResult.sources);
              Object.assign(context.previousResults, contactResult.data);
              
              // Update remaining fields
              const foundFields = Object.keys(contactResult.data);
              remainingFields.splice(0, remainingFields.length, 
                ...remainingFields.filter(f => !foundFields.includes(f.name))
              );
            }

            // Phase 3: Company Profile (if needed)
            if (fieldCategories.profile.length > 0 && remainingFields.length > 0) {
              if (onProgress) onProgress(`Searching for company profile...`, 'info');
              const profileResult = await this.profileAgent.execute(
                context,
                [...fieldCategories.profile, ...remainingFields], // Pass ALL remaining fields
                onProgress
              );
              Object.assign(allData, profileResult.data);
              allSources.push(...profileResult.sources);
              Object.assign(context.previousResults, profileResult.data);
              
              // Update remaining fields
              const foundFields = Object.keys(profileResult.data);
              remainingFields.splice(0, remainingFields.length, 
                ...remainingFields.filter(f => !foundFields.includes(f.name))
              );
            }

            // Phase 4: General/Custom Fields (if needed)
            if (fieldCategories.general.length > 0 && remainingFields.length > 0) {
              if (onProgress) onProgress(`Searching for custom fields...`, 'info');
              const generalResult = await this.generalAgent.execute(
                context,
                remainingFields, // Pass ALL remaining fields
                onProgress
              );
              Object.assign(allData, generalResult.data);
              allSources.push(...generalResult.sources);
            }
          }

          records.push({
            index: i,
            data: allData,
            sources: allSources,
            status: 'success',
          });

          const foundCount = fields.length - remainingFields.length;
          if (onProgress) {
            onProgress(
              `Company ${i + 1} completed: ${foundCount}/${fields.length} fields found`,
              'success'
            );
          }

        } catch (error) {
          console.error(`[Orchestrator] Error enriching company ${i + 1}:`, error);
          
          // Still include the discovered company data even if enrichment fails
          records.push({
            index: i,
            data: company.data,
            sources: company.sources,
            status: 'success', // Mark as success since we have basic data
          });

          if (onProgress) {
            onProgress(
              `Company ${i + 1} partially completed (enrichment failed)`,
              'warning'
            );
          }
        }
      }

      if (onProgress) {
        onProgress(`Batch generation completed: ${records.length} records`, 'success');
      }

      return records;

    } catch (error) {
      console.error(`[Orchestrator] Error in batch generation:`, error);
      
      if (onProgress) {
        onProgress(
          `Batch generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'warning'
        );
      }

      return [];
    }
  }

  /**
   * Generate a single record with all requested fields
   */
  async generateRecord(
    index: number,
    dataType: string,
    specifications: string | undefined,
    fields: EnrichmentField[],
    onProgress?: (message: string, type: 'info' | 'success' | 'warning') => void
  ): Promise<GeneratedRecord> {
    console.log(`[Orchestrator] Generating record ${index + 1}`);

    try {
      // Categorize fields by agent
      const fieldCategories = this.categorizeFields(fields);

      // Build context
      const context: AgentContext = {
        dataType,
        specifications,
        previousResults: {},
        recordIndex: index,
      };

      const allData: Record<string, any> = {};
      const allSources: SourceAttribution[] = [];

      // Phase 1: Discovery (find company names)
      if (fieldCategories.discovery.length > 0 || fieldCategories.needsCompanyName) {
        if (onProgress) onProgress(`Phase 1: Discovering companies...`, 'info');

        const discoveryResult = await this.discoveryAgent.execute(
          context,
          fieldCategories.discovery,
          onProgress
        );

        Object.assign(allData, discoveryResult.data);
        allSources.push(...discoveryResult.sources);
        Object.assign(context.previousResults, discoveryResult.data);
      }

      // Phase 2: Contact Info
      if (fieldCategories.contact.length > 0) {
        if (onProgress) onProgress(`Phase 2: Finding contact information...`, 'info');

        const contactResult = await this.contactAgent.execute(
          context,
          fieldCategories.contact,
          onProgress
        );

        Object.assign(allData, contactResult.data);
        allSources.push(...contactResult.sources);
        Object.assign(context.previousResults, contactResult.data);
      }

      // Phase 3: Company Profile
      if (fieldCategories.profile.length > 0) {
        if (onProgress) onProgress(`Phase 3: Extracting company profile...`, 'info');

        const profileResult = await this.profileAgent.execute(
          context,
          fieldCategories.profile,
          onProgress
        );

        Object.assign(allData, profileResult.data);
        allSources.push(...profileResult.sources);
        Object.assign(context.previousResults, profileResult.data);
      }

      // Phase 4: General/Custom Fields
      if (fieldCategories.general.length > 0) {
        if (onProgress) onProgress(`Phase 4: Handling custom fields...`, 'info');

        const generalResult = await this.generalAgent.execute(
          context,
          fieldCategories.general,
          onProgress
        );

        Object.assign(allData, generalResult.data);
        allSources.push(...generalResult.sources);
      }

      if (onProgress) onProgress(`Record ${index + 1} completed successfully`, 'success');

      return {
        index,
        data: allData,
        sources: allSources,
        status: 'success',
      };

    } catch (error) {
      console.error(`[Orchestrator] Error generating record ${index + 1}:`, error);

      if (onProgress) {
        onProgress(
          `Record ${index + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'warning'
        );
      }

      return {
        index,
        data: {},
        sources: [],
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Categorize fields by which agent should handle them
   */
  private categorizeFields(fields: EnrichmentField[]): {
    discovery: EnrichmentField[];
    contact: EnrichmentField[];
    profile: EnrichmentField[];
    general: EnrichmentField[];
    needsCompanyName: boolean;
  } {
    const discovery: EnrichmentField[] = [];
    const contact: EnrichmentField[] = [];
    const profile: EnrichmentField[] = [];
    const general: EnrichmentField[] = [];

    fields.forEach(field => {
      const fieldText = `${field.name} ${field.displayName} ${field.description}`.toLowerCase();

      // Company name/discovery fields
      if (
        fieldText.includes('company') ||
        fieldText.includes('会社') ||
        fieldText.includes('企業') ||
        fieldText.includes('name') ||
        fieldText.includes('名前') ||
        fieldText.includes('website') ||
        fieldText.includes('url')
      ) {
        discovery.push(field);
      }
      // Contact fields
      else if (
        fieldText.includes('email') ||
        fieldText.includes('phone') ||
        fieldText.includes('tel') ||
        fieldText.includes('address') ||
        fieldText.includes('連絡') ||
        fieldText.includes('電話') ||
        fieldText.includes('メール') ||
        fieldText.includes('住所')
      ) {
        contact.push(field);
      }
      // Profile fields
      else if (
        fieldText.includes('industry') ||
        fieldText.includes('業種') ||
        fieldText.includes('業界') ||
        fieldText.includes('description') ||
        fieldText.includes('概要') ||
        fieldText.includes('説明') ||
        fieldText.includes('size') ||
        fieldText.includes('規模') ||
        fieldText.includes('employee') ||
        fieldText.includes('従業員')
      ) {
        profile.push(field);
      }
      // Everything else goes to general agent
      else {
        general.push(field);
      }
    });

    // Check if we need company name for other agents
    const needsCompanyName = contact.length > 0 || profile.length > 0;

    return { discovery, contact, profile, general, needsCompanyName };
  }
}
