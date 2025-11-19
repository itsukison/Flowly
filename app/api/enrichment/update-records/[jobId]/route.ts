import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enrichmentJobManager } from '@/lib/services/enrichment/EnrichmentJobManager';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;
    const body = await request.json();
    const { selectedRecordIds } = body;

    if (!selectedRecordIds || !Array.isArray(selectedRecordIds)) {
      return NextResponse.json(
        { error: 'Invalid selectedRecordIds' },
        { status: 400 }
      );
    }

    // Get job results
    const job = enrichmentJobManager.getJob(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'completed') {
      return NextResponse.json(
        { error: 'Job not completed yet' },
        { status: 400 }
      );
    }

    // Filter results by selected record IDs
    const selectedResults = job.results.filter(result =>
      selectedRecordIds.includes(result.recordId)
    );

    let successCount = 0;
    let failureCount = 0;

    // Update each selected record
    for (const result of selectedResults) {
      if (!result.success) {
        failureCount++;
        continue;
      }

      try {
        // Fetch current record
        const { data: currentRecord, error: fetchError } = await supabase
          .from('records')
          .select('*')
          .eq('id', result.recordId)
          .single();

        if (fetchError || !currentRecord) {
          console.error(`Failed to fetch record ${result.recordId}`);
          failureCount++;
          continue;
        }

        // Build update payload
        const currentData = (currentRecord.data as Record<string, any>) || {};
        const updates: any = {};

        // Check if any fields are direct columns (email)
        const directFields = ['email', 'phone'];
        const hasDirectUpdates = result.fields.some(f =>
          directFields.includes(f.name) && f.value !== null
        );

        // Update JSONB data
        const updatedData = { ...currentData };
        result.fields.forEach(field => {
          if (field.value !== null) {
            // If it's a direct field, update at root level
            if (directFields.includes(field.name)) {
              updates[field.name] = field.value;
            } else {
              // Otherwise, update in JSONB data
              updatedData[field.name] = field.value;
            }
          }
        });

        // Add enrichment metadata
        updatedData.enrichment_metadata = {
          enriched_at: new Date().toISOString(),
          job_id: jobId,
          sources: result.sources,
        };

        updates.data = updatedData;

        // Update record
        const { error: updateError } = await supabase
          .from('records')
          .update(updates)
          .eq('id', result.recordId);

        if (updateError) {
          console.error(`Failed to update record ${result.recordId}:`, updateError);
          failureCount++;
        } else {
          successCount++;
        }

      } catch (error) {
        console.error(`Error updating record ${result.recordId}:`, error);
        failureCount++;
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      failureCount,
      totalProcessed: selectedResults.length,
    });

  } catch (error) {
    console.error('Update records error:', error);
    return NextResponse.json(
      { error: 'Failed to update records' },
      { status: 500 }
    );
  }
}
