import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(
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

    // Get generated records
    const { data: records, error: recordsError } = await supabase
      .from('ai_generated_records')
      .select('*')
      .eq('job_id', jobId)
      .eq('status', 'success')
      .order('record_index', { ascending: true });

    if (recordsError) {
      console.error('Error fetching records:', recordsError);
      return NextResponse.json(
        { error: "Failed to fetch records" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      job: {
        id: job.id,
        status: job.status,
        totalRecords: job.total_records,
        completedRecords: job.completed_records,
        failedRecords: job.failed_records,
      },
      records: records?.map(r => ({
        index: r.record_index,
        data: r.generated_data,
        sources: r.sources,
      })) || [],
    });

  } catch (error) {
    console.error("Error getting preview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
