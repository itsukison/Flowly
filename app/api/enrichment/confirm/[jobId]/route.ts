import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
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

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { jobId } = await params;
    const body = await request.json();
    const { selectedIndices } = body; // Array of record indices to insert

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('ai_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Get selected records
    const { data: records, error: recordsError } = await supabase
      .from('ai_generated_records')
      .select('*')
      .eq('job_id', jobId)
      .eq('status', 'success')
      .in('record_index', selectedIndices);

    if (recordsError || !records) {
      return NextResponse.json(
        { error: "Failed to fetch records" },
        { status: 500 }
      );
    }

    // Insert records into the actual table
    const recordsToInsert = records.map(r => ({
      table_id: job.table_id,
      organization_id: job.organization_id,
      data: r.generated_data,
      metadata: {
        ai_generated: true,
        sources: r.sources,
        generated_at: new Date().toISOString(),
        job_id: jobId,
      },
    }));

    const { error: insertError } = await supabase
      .from('records')
      .insert(recordsToInsert);

    if (insertError) {
      console.error('Error inserting records:', insertError);
      return NextResponse.json(
        { error: "Failed to insert records" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      insertedCount: recordsToInsert.length,
    });

  } catch (error) {
    console.error("Error confirming records:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
