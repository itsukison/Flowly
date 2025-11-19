import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { RecordInsertionService } from '@/lib/services/enrichment/RecordInsertionService';
import type { GeneratedCompany } from '@/lib/services/enrichment/types/insertion';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Authenticate user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { tableId, selectedIndices } = body;

    if (!tableId) {
      return NextResponse.json(
        { error: 'tableId is required' },
        { status: 400 }
      );
    }

    // Validate selectedIndices
    if (!Array.isArray(selectedIndices) || selectedIndices.length === 0) {
      return NextResponse.json(
        { error: 'At least one record must be selected' },
        { status: 400 }
      );
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('ai_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      );
    }

    // Check if job is completed
    if (job.status !== 'completed') {
      return NextResponse.json(
        { error: 'Job is not completed yet' },
        { status: 400 }
      );
    }

    // Get generated records
    const { data: generatedRecords, error: recordsError } = await supabase
      .from('ai_generated_records')
      .select('*')
      .eq('job_id', jobId)
      .eq('status', 'success')
      .order('record_index', { ascending: true });

    if (recordsError || !generatedRecords || generatedRecords.length === 0) {
      return NextResponse.json(
        { error: 'No generated records found' },
        { status: 404 }
      );
    }

    // Filter records by selected indices
    const selectedRecords = generatedRecords.filter((record) =>
      selectedIndices.includes(record.record_index)
    );

    if (selectedRecords.length === 0) {
      return NextResponse.json(
        { error: 'No matching records found for selected indices' },
        { status: 404 }
      );
    }

    // Transform to GeneratedCompany format
    const companies: GeneratedCompany[] = selectedRecords.map((record) => {
      const data = record.generated_data as Record<string, any>;
      const sources = (record.sources || []) as Array<{
        field: string;
        source: string;
        url?: string;
        confidence: number;
      }>;
      const fieldConfidence = (record.field_confidence || {}) as Record<
        string,
        number
      >;

      const fields = Object.entries(data).map(([name, value]) => {
        const source = sources.find((s) => s.field === name);
        return {
          name,
          value,
          confidence: fieldConfidence[name] || 0.5,
          source: (source?.source as any) || 'knowledge',
          sourceUrl: source?.url,
        };
      });

      return {
        name: data.company_name || data.name || 'Unknown',
        website: data.website || '',
        fields,
      };
    });

    // Get user's organization
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!userOrg) {
      return NextResponse.json(
        { error: 'User organization not found' },
        { status: 404 }
      );
    }

    // Insert records using RecordInsertionService
    const insertionService = new RecordInsertionService();
    const result = await insertionService.insertGeneratedRecords(
      jobId,
      companies,
      tableId,
      userOrg.organization_id,
      user.id
    );

    return NextResponse.json({
      success: true,
      inserted: result.success,
      failed: result.failed,
      errors: result.errors,
      message: `Successfully inserted ${result.success} records`,
    });
  } catch (error) {
    console.error('Error inserting records:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
