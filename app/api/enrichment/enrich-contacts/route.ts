import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Gemini3ContactEnrichmentAgent } from '@/lib/services/enrichment/agents/Gemini3ContactEnrichmentAgent';
import { enrichmentJobManager } from '@/lib/services/enrichment/EnrichmentJobManager';
import type { TableRecord } from '@/lib/services/enrichment/agents/Gemini3ContactEnrichmentAgent';
import type { EnrichmentField } from '@/lib/services/enrichment/types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_KEY;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!GEMINI_API_KEY || !FIRECRAWL_API_KEY) {
      return NextResponse.json(
        { error: 'API keys not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { recordIds, targetColumns, newColumns, tableId } = body;

    // Validate request
    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return NextResponse.json({ error: 'Invalid recordIds' }, { status: 400 });
    }

    if (!targetColumns || !Array.isArray(targetColumns)) {
      return NextResponse.json({ error: 'Invalid targetColumns' }, { status: 400 });
    }

    if (!tableId) {
      return NextResponse.json({ error: 'Invalid tableId' }, { status: 400 });
    }

    // Fetch records
    const { data: records, error: fetchError } = await supabase
      .from('records')
      .select('*')
      .in('id', recordIds);

    if (fetchError || !records || records.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch records' },
        { status: 500 }
      );
    }

    // Create new columns if needed
    if (newColumns && Array.isArray(newColumns) && newColumns.length > 0) {
      for (const newCol of newColumns) {
        // Check if column already exists
        const { data: existingColumn } = await supabase
          .from('table_columns')
          .select('id')
          .eq('table_id', tableId)
          .eq('name', newCol.name)
          .single();

        if (!existingColumn) {
          // Get max display order
          const { data: maxOrder } = await supabase
            .from('table_columns')
            .select('display_order')
            .eq('table_id', tableId)
            .order('display_order', { ascending: false })
            .limit(1)
            .single();

          // Create column
          await supabase
            .from('table_columns')
            .insert({
              table_id: tableId,
              name: newCol.name,
              label: newCol.label,
              type: newCol.type || 'text',
              is_required: false,
              display_order: (maxOrder?.display_order || 0) + 1,
              options: {},
            });
        }
      }
    }

    // Create job
    const jobId = enrichmentJobManager.createJob(records.length);

    // Start enrichment in background
    enrichRecordsInBackground(
      jobId,
      records as TableRecord[],
      targetColumns,
      tableId
    );

    return NextResponse.json({
      jobId,
      status: 'processing',
      totalRecords: records.length,
      completedRecords: 0,
    });

  } catch (error) {
    console.error('Enrichment error:', error);
    return NextResponse.json(
      { error: 'Failed to start enrichment' },
      { status: 500 }
    );
  }
}

/**
 * Enrich records in background
 */
async function enrichRecordsInBackground(
  jobId: string,
  records: TableRecord[],
  targetColumns: string[],
  tableId: string
) {
  try {
    const agent = new Gemini3ContactEnrichmentAgent(
      GEMINI_API_KEY!,
      FIRECRAWL_API_KEY!
    );

    // Build target fields, filtering out fields that already have values
    const targetFields: EnrichmentField[] = targetColumns
      .filter(col => {
        // Check if the field is empty in the record
        const recordData = records[0]; // Check first record for structure
        const directValue = (recordData as any)[col];
        const jsonbValue = recordData.data?.[col];
        
        // Include field if it's empty (null, undefined, or empty string)
        return !directValue && !jsonbValue;
      })
      .map(col => ({
        name: col,
        displayName: col,
        description: col,
        type: 'string' as const,
        required: false,
      }));

    if (targetFields.length === 0) {
      enrichmentJobManager.completeJob(jobId);
      console.log('[Enrichment] No empty fields to enrich. Skipping.');
      return;
    }

    console.log(`[Enrichment] Fields to enrich: ${targetFields.map(f => f.name).join(', ')}`);

    // Enrich each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const recordName = record.name || record.company || `Record ${i + 1}`;

      // Filter target fields for THIS specific record (skip fields that already have data)
      const recordTargetFields = targetFields.filter(field => {
        const directValue = (record as any)[field.name];
        const jsonbValue = record.data?.[field.name];
        const isEmpty = !directValue && !jsonbValue;
        
        if (!isEmpty) {
          console.log(`[Enrichment] Skipping ${field.name} for ${recordName} - already filled`);
        }
        
        return isEmpty;
      });

      if (recordTargetFields.length === 0) {
        enrichmentJobManager.addResult(jobId, {
          recordId: record.id,
          success: true,
          fields: [],
          sources: [],
        });
        continue;
      }

      enrichmentJobManager.updateProgress(
        jobId,
        i,
        recordName,
        `Enriching ${recordName} (${recordTargetFields.length} fields)...`
      );

      try {
        const result = await agent.enrichRecord(
          record,
          recordTargetFields,
          (message, type) => {
            enrichmentJobManager.updateProgress(jobId, i, recordName, message);
          }
        );

        enrichmentJobManager.addResult(jobId, result);

      } catch (error) {
        console.error(`Error enriching record ${record.id}:`, error);
        
        // Add failed result
        enrichmentJobManager.addResult(jobId, {
          recordId: record.id,
          success: false,
          fields: targetFields.map(f => ({ name: f.name, value: null, confidence: 0 })),
          sources: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    enrichmentJobManager.completeJob(jobId);

  } catch (error) {
    console.error('Background enrichment error:', error);
    enrichmentJobManager.failJob(
      jobId,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
