/**
 * Table Enrichment Orchestrator
 * Adapted from fire-enrich for generating new records instead of enriching existing ones
 */

import { createServerClient } from "@supabase/ssr";

interface EnrichmentRequirements {
  rowCount: number;
  targetColumns: string[];
  dataType: string;
  specifications?: string;
}

interface TableColumn {
  id: string;
  name: string;
  label: string;
  type: string;
}

interface GeneratedRecord {
  id: string;
  data: Record<string, any>;
  common_fields: {
    name?: string;
    email?: string;
    company?: string;
    status?: string;
  };
  enrichment_metadata: Array<{
    field_name: string;
    confidence_score: number;
    sources: string[];
    agent_type: string;
  }>;
}

export class TableEnrichmentOrchestrator {
  private firecrawlApiKey: string;
  private geminiApiKey: string;

  constructor() {
    this.firecrawlApiKey = process.env.FIRECRAWL_KEY || '';
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
  }

  private createSupabaseClient() {
    // For background processing, we'll create a service client
    // This runs on the server without user context for record generation
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
        },
      }
    );
  }

  /**
   * Start the enrichment process for a table
   */
  async startEnrichment(sessionId: string, requirements: EnrichmentRequirements): Promise<void> {
    try {
      console.log(`[ORCHESTRATOR] Starting enrichment for session ${sessionId}`);
      console.log(`[ORCHESTRATOR] Requirements:`, requirements);

      const supabase = this.createSupabaseClient();

      // Get session and table information
      const { data: session, error: sessionError } = await supabase
        .from('ai_enrichment_sessions')
        .select(`
          *,
          tables (
            id,
            name,
            schema
          )
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        throw new Error('Session not found');
      }

      const table = session.tables as any;
      const allColumns = this.extractColumnsFromSchema(table.schema);
      const targetColumns = allColumns.filter(col =>
        requirements.targetColumns.includes(col.name)
      );

      console.log(`[ORCHESTRATOR] Target columns: ${targetColumns.map(c => c.name).join(', ')}`);

      // Update session status
      await supabase
        .from('ai_enrichment_sessions')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      // Start generation process
      await this.generateRecords(sessionId, requirements, targetColumns);

    } catch (error) {
      console.error(`[ORCHESTRATOR] Error starting enrichment:`, error);

      // Mark session as failed
      const supabase = this.createSupabaseClient();
      await supabase
        .from('ai_enrichment_sessions')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    }
  }

  /**
   * Generate records using AI agents
   */
  private async generateRecords(
    sessionId: string,
    requirements: EnrichmentRequirements,
    columns: TableColumn[]
  ): Promise<void> {
    console.log(`[ORCHESTRATOR] Starting record generation...`);

    const supabase = this.createSupabaseClient();

    // Update session with target record count
    await supabase
      .from('ai_enrichment_sessions')
      .update({
        records_generated: requirements.rowCount,
        records_completed: 0,
      })
      .eq('id', sessionId);

    // Categorize columns for agent assignment
    const categorizedColumns = this.categorizeColumns(columns);

    console.log(`[ORCHESTRATOR] Column categories:`, {
      discovery: categorizedColumns.discovery.length,
      profile: categorizedColumns.profile.length,
      metrics: categorizedColumns.metrics.length,
      funding: categorizedColumns.funding.length,
      techStack: categorizedColumns.techStack.length,
      general: categorizedColumns.general.length,
    });

    // Generate records in batches
    const batchSize = 5; // Process 5 records at a time
    for (let i = 0; i < requirements.rowCount; i += batchSize) {
      const batchEnd = Math.min(i + batchSize, requirements.rowCount);
      const batchCount = batchEnd - i;

      console.log(`[ORCHESTRATOR] Processing batch ${i + 1}-${batchEnd} of ${requirements.rowCount}`);

      // Generate a batch of records
      const generatedBatch = await this.generateRecordBatch(
        batchCount,
        requirements,
        categorizedColumns
      );

      // Save batch to database
      await this.saveGeneratedBatch(sessionId, generatedBatch, columns);

      // Update progress
      const completedCount = Math.min(batchEnd, requirements.rowCount);
      await supabase
        .from('ai_enrichment_sessions')
        .update({
          records_completed: completedCount,
        })
        .eq('id', sessionId);
    }

    // Mark session as completed
    await supabase
      .from('ai_enrichment_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    console.log(`[ORCHESTRATOR] Enrichment completed for session ${sessionId}`);
  }

  /**
   * Generate a batch of records
   */
  private async generateRecordBatch(
    count: number,
    requirements: EnrichmentRequirements,
    categorizedColumns: Record<string, TableColumn[]>
  ): Promise<GeneratedRecord[]> {
    console.log(`[ORCHESTRATOR] Generating ${count} records...`);

    const records: GeneratedRecord[] = [];

    for (let i = 0; i < count; i++) {
      const record = await this.generateSingleRecord(requirements, categorizedColumns);
      records.push(record);
    }

    return records;
  }

  /**
   * Generate a single record
   */
  private async generateSingleRecord(
    requirements: EnrichmentRequirements,
    categorizedColumns: Record<string, TableColumn[]>
  ): Promise<GeneratedRecord> {
    console.log(`[ORCHESTRATOR] Generating single record...`);

    // Use Gemini to generate business data based on requirements
    const generatedData = await this.generateBusinessData(requirements, categorizedColumns);

    // Create the record structure
    const commonFields: GeneratedRecord['common_fields'] = {};
    const dataFields: Record<string, any> = {};
    const enrichmentMetadata: GeneratedRecord['enrichment_metadata'] = [];

    // Separate common fields from custom data
    Object.entries(generatedData).forEach(([fieldName, value]) => {
      if (['name', 'email', 'company', 'status'].includes(fieldName)) {
        commonFields[fieldName as keyof typeof commonFields] = value as any;
      } else {
        dataFields[fieldName] = value;
      }

      // Add enrichment metadata
      enrichmentMetadata.push({
        field_name: fieldName,
        confidence_score: this.calculateConfidenceScore(fieldName, value),
        sources: [`AI generated based on: ${requirements.dataType}`],
        agent_type: this.getAgentTypeForField(fieldName, categorizedColumns),
      });
    });

    return {
      id: `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data: dataFields,
      common_fields: commonFields,
      enrichment_metadata: enrichmentMetadata,
    };
  }

  /**
   * Use Gemini to generate business data
   */
  private async generateBusinessData(
    requirements: EnrichmentRequirements,
    categorizedColumns: Record<string, TableColumn[]>
  ): Promise<Record<string, any>> {
    const prompt = this.buildGenerationPrompt(requirements, categorizedColumns);

    try {
      // Call Gemini API
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const result = await response.json();
      const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error('No response from Gemini');
      }

      // Parse the generated JSON
      const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      } else {
        // Try to parse as JSON directly
        return JSON.parse(generatedText);
      }

    } catch (error) {
      console.error('[ORCHESTRATOR] Error generating business data:', error);

      // Fallback: generate basic data
      return this.generateFallbackData(requirements, categorizedColumns);
    }
  }

  /**
   * Build the generation prompt for Gemini
   */
  private buildGenerationPrompt(
    requirements: EnrichmentRequirements,
    categorizedColumns: Record<string, TableColumn[]>
  ): string {
    const allColumns = [
      ...categorizedColumns.discovery,
      ...categorizedColumns.profile,
      ...categorizedColumns.metrics,
      ...categorizedColumns.funding,
      ...categorizedColumns.techStack,
      ...categorizedColumns.general,
    ];

    return `You are a business data generation expert. Generate realistic, diverse business data based on the following requirements:

REQUIREMENTS:
- Data Type: ${requirements.dataType}
- Specifications: ${requirements.specifications || 'None'}
- Number of Records: 1 (generating one record at a time)

TARGET FIELDS:
${allColumns.map(col => `- ${col.name} (${col.type}): ${col.label}`).join('\n')}

GUIDELINES:
1. Generate realistic, plausible data that matches the specified business type
2. Ensure diversity in generated data (avoid repetitive patterns)
3. Use appropriate formats for each field type
4. Generate valid email addresses when email field is requested
5. Use realistic company names and domains
6. Ensure all data is coherent and consistent across fields

BUSINESS TYPE FOCUS:
${requirements.dataType}

${requirements.specifications ? `ADDITIONAL SPECIFICATIONS:\n${requirements.specifications}` : ''}

Please generate one record of business data as a JSON object with the following structure:
{
  "field_name": "value_for_field",
  ...
}

Ensure the data is:
- Realistic and believable
- Appropriate for the specified business type
- Properly formatted for each field type
- Diverse and varied

Generate only the JSON response, no additional text.`;
  }

  /**
   * Generate fallback data in case Gemini fails
   */
  private generateFallbackData(
    requirements: EnrichmentRequirements,
    categorizedColumns: Record<string, TableColumn[]>
  ): Record<string, any> {
    const data: Record<string, any> = {};

    // Basic company generation
    const companyNames = ['TechCorp', 'DataFlow', 'CloudBase', 'InnovateLabs', 'FutureSoft'];
    const domains = ['com', 'io', 'ai', 'tech', 'solutions'];
    const companyName = companyNames[Math.floor(Math.random() * companyNames.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];

    // Generate data for each column
    const allColumns = [
      ...categorizedColumns.discovery,
      ...categorizedColumns.profile,
      ...categorizedColumns.metrics,
      ...categorizedColumns.funding,
      ...categorizedColumns.techStack,
      ...categorizedColumns.general,
    ];

    allColumns.forEach(column => {
      switch (column.type) {
        case 'text':
        case 'string':
          if (column.name.toLowerCase().includes('email')) {
            data[column.name] = `contact@${companyName.toLowerCase().replace(/\s+/g, '')}.${domain}`;
          } else if (column.name.toLowerCase().includes('company')) {
            data[column.name] = companyName;
          } else if (column.name.toLowerCase().includes('website')) {
            data[column.name] = `https://${companyName.toLowerCase().replace(/\s+/g, '')}.${domain}`;
          } else {
            data[column.name] = `${column.label} value`;
          }
          break;
        case 'number':
          if (column.name.toLowerCase().includes('employee')) {
            data[column.name] = Math.floor(Math.random() * 1000) + 10;
          } else if (column.name.toLowerCase().includes('revenue')) {
            data[column.name] = Math.floor(Math.random() * 10000000) + 100000;
          } else {
            data[column.name] = Math.floor(Math.random() * 100);
          }
          break;
        case 'boolean':
          data[column.name] = Math.random() > 0.5;
          break;
        default:
          data[column.name] = `${column.label} value`;
      }
    });

    return data;
  }

  /**
   * Categorize columns for agent assignment
   */
  private categorizeColumns(columns: TableColumn[]): Record<string, TableColumn[]> {
    const categories = {
      discovery: [] as TableColumn[],
      profile: [] as TableColumn[],
      metrics: [] as TableColumn[],
      funding: [] as TableColumn[],
      techStack: [] as TableColumn[],
      general: [] as TableColumn[],
    };

    columns.forEach(column => {
      const name = column.name.toLowerCase();

      if (name.includes('company') && (name.includes('name') || name.includes('website'))) {
        categories.discovery.push(column);
      } else if (name.includes('industry') || name.includes('location') || name.includes('headquarter') || name.includes('founded')) {
        categories.profile.push(column);
      } else if (name.includes('employee') || name.includes('revenue') || name.includes('size')) {
        categories.metrics.push(column);
      } else if (name.includes('fund') || name.includes('invest') || name.includes('valuation')) {
        categories.funding.push(column);
      } else if (name.includes('tech') && name.includes('stack') || name.includes('technolog') || name.includes('framework')) {
        categories.techStack.push(column);
      } else {
        categories.general.push(column);
      }
    });

    return categories;
  }

  /**
   * Calculate confidence score for generated data
   */
  private calculateConfidenceScore(fieldName: string, value: any): number {
    // Base confidence on field type and value quality
    let confidence = 0.8; // Base confidence for AI-generated data

    const name = fieldName.toLowerCase();

    // Higher confidence for well-structured fields
    if (name.includes('email') && typeof value === 'string' && value.includes('@')) {
      confidence = 0.9;
    } else if (name.includes('website') && typeof value === 'string' && value.startsWith('http')) {
      confidence = 0.9;
    } else if (name.includes('company') && typeof value === 'string' && value.length > 2) {
      confidence = 0.85;
    } else if (name.includes('revenue') && typeof value === 'number' && value > 0) {
      confidence = 0.7;
    } else if (name.includes('employee') && typeof value === 'number' && value > 0) {
      confidence = 0.7;
    }

    return Math.min(0.95, confidence);
  }

  /**
   * Get agent type for a field
   */
  private getAgentTypeForField(fieldName: string, categorizedColumns: Record<string, TableColumn[]>): string {
    for (const [agentType, columns] of Object.entries(categorizedColumns)) {
      if (columns.some(col => col.name === fieldName)) {
        return `${agentType}-agent`;
      }
    }
    return 'general-agent';
  }

  /**
   * Extract columns from table schema
   */
  private extractColumnsFromSchema(schema: any): TableColumn[] {
    if (!schema || !schema.columns) {
      return [];
    }

    return schema.columns.map((col: any) => ({
      id: col.id,
      name: col.name,
      label: col.label || col.name,
      type: col.type || 'text',
    }));
  }

  /**
   * Save generated batch to database
   */
  private async saveGeneratedBatch(
    sessionId: string,
    batch: GeneratedRecord[],
    columns: TableColumn[]
  ): Promise<void> {
    console.log(`[ORCHESTRATOR] Saving batch of ${batch.length} records...`);

    const supabase = this.createSupabaseClient();

    // Get session info for record creation
    const { data: session } = await supabase
      .from('ai_enrichment_sessions')
      .select('table_id, organization_id, user_id')
      .eq('id', sessionId)
      .single();

    if (!session) {
      throw new Error('Session not found');
    }

    // Insert records
    for (const record of batch) {
      // Insert main record
      const { data: newRecord, error: recordError } = await supabase
        .from('records')
        .insert({
          table_id: session.table_id,
          organization_id: session.organization_id,
          created_by: session.user_id,
          ...record.common_fields,
          data: record.data,
        })
        .select()
        .single();

      if (recordError) {
        console.error('[ORCHESTRATOR] Error creating record:', recordError);
        continue;
      }

      // Insert enrichment metadata
      for (const metadata of record.enrichment_metadata) {
        await supabase
          .from('ai_enrichment_records')
          .insert({
            session_id: sessionId,
            record_id: newRecord.id,
            field_name: metadata.field_name,
            field_value: JSON.stringify(
              record.common_fields[metadata.field_name as keyof typeof record.common_fields] ||
              record.data[metadata.field_name]
            ),
            data_type: columns.find(c => c.name === metadata.field_name)?.type || 'text',
            confidence_score: metadata.confidence_score,
            sources: metadata.sources,
            agent_type: metadata.agent_type,
            validation_status: 'validated',
          });
      }
    }

    console.log(`[ORCHESTRATOR] Batch saved successfully`);
  }
}