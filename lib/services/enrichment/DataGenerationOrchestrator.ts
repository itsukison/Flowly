/**
 * Data Generation Orchestrator
 * Main orchestrator that coordinates the entire data generation process
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { AgentOrchestrator } from './AgentOrchestrator';
import { EnrichmentRequirements, GeneratedRecord, ProgressUpdate } from './types';

export class DataGenerationOrchestrator {
  private agentOrchestrator: AgentOrchestrator;

  constructor(
    firecrawlApiKey: string,
    geminiApiKey: string,
    serpApiKey?: string
  ) {
    this.agentOrchestrator = new AgentOrchestrator(
      firecrawlApiKey,
      geminiApiKey,
      serpApiKey
    );
  }

  /**
   * Start the data generation process
   */
  async startGeneration(
    jobId: string,
    tableId: string,
    userId: string,
    organizationId: string,
    requirements: EnrichmentRequirements,
    onProgress?: (update: ProgressUpdate) => void
  ): Promise<void> {
    console.log(`[DataGeneration] Starting job ${jobId} for ${requirements.rowCount} records`);

    // Create Supabase client with service role key
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
      // Update job status to processing
      await supabase
        .from('ai_generation_jobs')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      // Send initial progress
      if (onProgress) {
        onProgress({
          jobId,
          totalRecords: requirements.rowCount,
          completedRecords: 0,
          failedRecords: 0,
          status: 'processing',
          message: 'Starting data generation...',
        });
      }

      // Generate records using batch discovery
      let completedCount = 0;
      let failedCount = 0;

      // Send progress update for batch discovery
      if (onProgress) {
        onProgress({
          jobId,
          totalRecords: requirements.rowCount,
          completedRecords: 0,
          failedRecords: 0,
          status: 'processing',
          message: `Batch discovering ${requirements.rowCount} companies...`,
        });
      }

      // Use batch discovery to find all companies at once
      const records = await this.agentOrchestrator.generateRecordsBatch(
        requirements.rowCount,
        requirements.dataType,
        requirements.specifications,
        requirements.targetColumns.map(colName => ({
          name: colName,
          displayName: colName,
          description: `Field: ${colName}`,
          type: 'string',
          required: false,
        })),
        (message, type) => {
          if (onProgress) {
            onProgress({
              jobId,
              totalRecords: requirements.rowCount,
              completedRecords: completedCount,
              failedRecords: failedCount,
              status: 'processing',
              message,
            });
          }
        }
      );

      // Process each generated record
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        
        try {
          // Send progress update
          if (onProgress) {
            onProgress({
              jobId,
              totalRecords: requirements.rowCount,
              completedRecords: completedCount,
              failedRecords: failedCount,
              status: 'processing',
              currentRecord: i + 1,
              message: `Saving record ${i + 1}/${records.length}...`,
            });
          }

          // Save generated record to database for tracking
          await this.saveGeneratedRecord(jobId, record);

          // Insert into table in real-time (no confirmation needed)
          if (record.status === 'success') {
            await this.insertIntoTable(
              supabase,
              tableId,
              organizationId,
              record
            );
            completedCount++;
          } else {
            failedCount++;
          }

          // Update job progress
          await supabase
            .from('ai_generation_jobs')
            .update({
              completed_records: completedCount,
              failed_records: failedCount,
            })
            .eq('id', jobId);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[DataGeneration] Error saving record ${i + 1}:`, errorMessage);
          
          // Check if it's a critical error that should stop the entire job
          if (errorMessage.includes('Insufficient Firecrawl credits')) {
            console.error(`[DataGeneration] Critical error: ${errorMessage}. Stopping job.`);
            
            // Mark job as failed
            await supabase
              .from('ai_generation_jobs')
              .update({
                status: 'failed',
                completed_at: new Date().toISOString(),
                error_message: errorMessage,
                completed_records: completedCount,
                failed_records: failedCount + (records.length - i),
              })
              .eq('id', jobId);
            
            throw error; // Stop the entire job
          }
          
          failedCount++;

          // Save failed record
          await this.saveGeneratedRecord(jobId, {
            index: i,
            data: {},
            sources: [],
            status: 'failed',
            error: errorMessage,
          });
        }
      }

      // If we got fewer records than requested, mark the rest as failed
      if (records.length < requirements.rowCount) {
        failedCount += requirements.rowCount - records.length;
      }

      // Mark job as completed
      await supabase
        .from('ai_generation_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_records: completedCount,
          failed_records: failedCount,
        })
        .eq('id', jobId);

      // Send final progress
      if (onProgress) {
        onProgress({
          jobId,
          totalRecords: requirements.rowCount,
          completedRecords: completedCount,
          failedRecords: failedCount,
          status: 'completed',
          message: `Generation completed: ${completedCount} success, ${failedCount} failed`,
        });
      }

      console.log(`[DataGeneration] Job ${jobId} completed: ${completedCount}/${requirements.rowCount} records`);

    } catch (error) {
      console.error(`[DataGeneration] Job ${jobId} failed:`, error);

      // Mark job as failed
      await supabase
        .from('ai_generation_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', jobId);

      // Send error progress
      if (onProgress) {
        onProgress({
          jobId,
          totalRecords: requirements.rowCount,
          completedRecords: 0,
          failedRecords: requirements.rowCount,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Save generated record to database
   */
  private async saveGeneratedRecord(jobId: string, record: GeneratedRecord): Promise<void> {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from('ai_generated_records').insert({
      job_id: jobId,
      record_index: record.index,
      generated_data: record.data,
      sources: record.sources,
      status: record.status,
      error_message: record.error,
    });
  }

  /**
   * Insert generated data into the actual table
   */
  private async insertIntoTable(
    supabase: any,
    tableId: string,
    organizationId: string,
    record: GeneratedRecord
  ): Promise<void> {
    try {
      // Insert into records table
      await supabase.from('records').insert({
        table_id: tableId,
        organization_id: organizationId,
        data: record.data,
        metadata: {
          ai_generated: true,
          sources: record.sources,
          generated_at: new Date().toISOString(),
        },
      });

      console.log(`[DataGeneration] Inserted record ${record.index + 1} into table ${tableId}`);
    } catch (error) {
      console.error(`[DataGeneration] Error inserting record into table:`, error);
      throw error;
    }
  }
}
