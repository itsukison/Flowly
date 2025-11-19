import { createClient } from '@/lib/supabase/server';
import type {
  GeneratedCompany,
  RecordInsert,
  RecordMetadata,
  ColumnDefinition,
  FieldAnalysis,
  InsertionResult,
  ColumnType,
  ProgressCallback,
} from './types/insertion';

export class RecordInsertionService {
  async insertGeneratedRecords(
    jobId: string,
    companies: GeneratedCompany[],
    tableId: string,
    organizationId: string,
    userId: string,
    onProgress?: ProgressCallback
  ): Promise<InsertionResult> {
    const supabase = await createClient();

    // Step 1: Analyze fields
    onProgress?.({
      stage: 'insertion',
      message: 'Analyzing generated fields...',
      type: 'info',
    });

    const { existingColumns, newColumns } = await this.analyzeFields(
      tableId,
      companies,
      supabase
    );

    // Step 2: Create missing columns
    if (newColumns.length > 0) {
      onProgress?.({
        stage: 'insertion',
        message: `Creating ${newColumns.length} new columns: ${newColumns.map((c) => c.name).join(', ')}`,
        type: 'info',
      });

      await this.createMissingColumns(tableId, newColumns, supabase);
    }

    // Get default status
    const defaultStatus = await this.getDefaultStatus(tableId, supabase);

    // Step 3-6: Insert each record
    const insertedRecords: string[] = [];
    const errors: Array<{ company: string; error: string }> = [];

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];

      try {
        // Map to record format
        const recordData = this.mapToRecordFormat(
          company,
          tableId,
          organizationId,
          userId,
          defaultStatus
        );

        // Insert into records
        const recordId = await this.insertRecord(recordData, jobId, supabase);

        // Build metadata
        const metadata = this.buildMetadata(company, i);

        // Insert into ai_generated_records
        await this.insertMetadata(jobId, i, company, metadata, supabase);

        // Update progress
        await this.updateJobProgress(jobId, 'completed', supabase);

        insertedRecords.push(recordId);

        onProgress?.({
          stage: 'insertion',
          message: `Inserted ${i + 1}/${companies.length}: ${company.name}`,
          type: 'success',
          company: company.name,
          progress: {
            current: i + 1,
            total: companies.length,
            percentage: Math.round(((i + 1) / companies.length) * 100),
          },
        });
      } catch (error) {
        errors.push({
          company: company.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        await this.updateJobProgress(
          jobId,
          'failed',
          supabase,
          error instanceof Error ? error.message : 'Unknown error'
        );

        onProgress?.({
          stage: 'insertion',
          message: `Failed to insert ${company.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error',
          company: company.name,
        });
      }
    }

    // Final status update
    if (errors.length === 0) {
      await this.completeJob(jobId, supabase);
      onProgress?.({
        stage: 'complete',
        message: `All ${companies.length} records inserted successfully`,
        type: 'success',
      });
    } else {
      onProgress?.({
        stage: 'complete',
        message: `Inserted ${insertedRecords.length}/${companies.length} records (${errors.length} failed)`,
        type: 'warning',
      });
    }

    return {
      success: insertedRecords.length,
      failed: errors.length,
      insertedRecords,
      errors,
    };
  }

  private async analyzeFields(
    tableId: string,
    companies: GeneratedCompany[],
    supabase: any
  ): Promise<FieldAnalysis> {
    // Get existing columns
    const { data: existingColumns } = await supabase
      .from('table_columns')
      .select('name, type')
      .eq('table_id', tableId);

    const existingNames = new Set(existingColumns?.map((c: any) => c.name) || []);

    // Find new fields across all companies
    const newFieldsSet = new Set<string>();
    for (const company of companies) {
      for (const field of company.fields) {
        if (!existingNames.has(field.name)) {
          newFieldsSet.add(field.name);
        }
      }
    }

    // Infer types for new fields
    const newColumns = Array.from(newFieldsSet).map((fieldName, index) => ({
      name: fieldName,
      label: this.formatLabel(fieldName),
      type: this.inferType(fieldName, companies),
      display_order: (existingColumns?.length || 0) + index,
    }));

    return { existingColumns: existingColumns || [], newColumns };
  }

  private async createMissingColumns(
    tableId: string,
    newColumns: ColumnDefinition[],
    supabase: any
  ): Promise<void> {
    for (const column of newColumns) {
      await supabase.from('table_columns').insert({
        table_id: tableId,
        name: column.name,
        label: column.label,
        type: column.type,
        display_order: column.display_order,
      });
    }
  }

  private mapToRecordFormat(
    company: GeneratedCompany,
    tableId: string,
    organizationId: string,
    userId: string,
    defaultStatus: string
  ): RecordInsert {
    const fieldMap = new Map(company.fields.map((f) => [f.name, f.value]));

    // Extract fixed columns
    const name = fieldMap.get('company_name') || fieldMap.get('name') || company.name;
    const email = fieldMap.get('email') || null;
    const companyName = fieldMap.get('company_name') || name;

    // Build JSONB data (exclude fixed columns)
    const data: Record<string, any> = {};
    for (const field of company.fields) {
      if (!['company_name', 'name', 'email'].includes(field.name)) {
        data[field.name] = field.value;
      }
    }

    return {
      table_id: tableId,
      organization_id: organizationId,
      name,
      email,
      company: companyName,
      status: defaultStatus,
      data,
      created_by: userId,
      is_ai_generated: true,
    };
  }

  private buildMetadata(company: GeneratedCompany, recordIndex: number): RecordMetadata {
    // Build field_confidence map
    const fieldConfidence: Record<string, number> = {};
    for (const field of company.fields) {
      fieldConfidence[field.name] = field.confidence;
    }

    // Build enriched_fields array (confidence < 0.80)
    const enrichedFields = company.fields
      .filter((f) => f.confidence < 0.8 || f.source !== 'knowledge')
      .map((f) => f.name);

    // Determine enrichment_method
    const sources = new Set(company.fields.map((f) => f.source));
    let enrichmentMethod: 'knowledge' | 'url_context' | 'firecrawl' | 'hybrid';
    if (sources.size === 1) {
      enrichmentMethod = Array.from(sources)[0] as any;
    } else {
      enrichmentMethod = 'hybrid';
    }

    // Build sources array
    const sourcesArray = company.fields.map((field) => ({
      field: field.name,
      source: field.source,
      url: field.sourceUrl,
      confidence: field.confidence,
    }));

    return {
      field_confidence: fieldConfidence,
      enriched_fields: enrichedFields,
      enrichment_method: enrichmentMethod,
      sources: sourcesArray,
    };
  }

  private async insertRecord(
    recordData: RecordInsert,
    jobId: string,
    supabase: any
  ): Promise<string> {
    const { data, error } = await supabase
      .from('records')
      .insert({
        ...recordData,
        ai_generation_job_id: jobId,
      })
      .select('id')
      .single();

    if (error) throw new Error(`Failed to insert record: ${error.message}`);
    return data.id;
  }

  private async insertMetadata(
    jobId: string,
    recordIndex: number,
    company: GeneratedCompany,
    metadata: RecordMetadata,
    supabase: any
  ): Promise<void> {
    const generatedData = Object.fromEntries(
      company.fields.map((f) => [f.name, f.value])
    );

    const { error } = await supabase.from('ai_generated_records').insert({
      job_id: jobId,
      record_index: recordIndex,
      generated_data: generatedData,
      sources: metadata.sources,
      field_confidence: metadata.field_confidence,
      enriched_fields: metadata.enriched_fields,
      enrichment_method: metadata.enrichment_method,
      status: 'success',
    });

    if (error) throw new Error(`Failed to insert metadata: ${error.message}`);
  }

  private async updateJobProgress(
    jobId: string,
    type: 'completed' | 'failed',
    supabase: any,
    errorMessage?: string
  ): Promise<void> {
    // Fetch current values first
    const { data: currentJob } = await supabase
      .from('ai_generation_jobs')
      .select('completed_records, failed_records')
      .eq('id', jobId)
      .single();

    if (!currentJob) return;

    if (type === 'completed') {
      await supabase
        .from('ai_generation_jobs')
        .update({
          completed_records: currentJob.completed_records + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    } else {
      await supabase
        .from('ai_generation_jobs')
        .update({
          failed_records: currentJob.failed_records + 1,
          error_message: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }
  }

  private async completeJob(jobId: string, supabase: any): Promise<void> {
    await supabase
      .from('ai_generation_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  }

  private async getDefaultStatus(tableId: string, supabase: any): Promise<string> {
    const { data } = await supabase
      .from('table_statuses')
      .select('name')
      .eq('table_id', tableId)
      .order('display_order', { ascending: true })
      .limit(1)
      .single();

    return data?.name || 'New';
  }

  private formatLabel(fieldName: string): string {
    return fieldName
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private inferType(fieldName: string, companies: GeneratedCompany[]): ColumnType {
    // Pattern-based inference
    if (fieldName.includes('email')) return 'email';
    if (fieldName.includes('phone') || fieldName.includes('tel')) return 'phone';
    if (fieldName.includes('url') || fieldName.includes('website')) return 'url';
    if (fieldName.includes('date') || fieldName.includes('founded')) return 'date';

    // Value-based inference
    const sampleValue = this.getSampleValue(fieldName, companies);
    if (typeof sampleValue === 'number') return 'number';
    if (typeof sampleValue === 'boolean') return 'boolean';

    return 'text';
  }

  private getSampleValue(fieldName: string, companies: GeneratedCompany[]): any {
    for (const company of companies) {
      const field = company.fields.find((f) => f.name === fieldName);
      if (field && field.value !== null && field.value !== undefined) {
        return field.value;
      }
    }
    return null;
  }
}
