import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface EnrichmentRequest {
  sessionId: string;
  requirements: {
    rowCount: number;
    targetColumns: string[];
    dataType: string;
    specifications?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user with proper server client
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

    // Parse request body
    const body = await request.json();
    const { sessionId, requirements } = body as EnrichmentRequest;

    if (!sessionId || !requirements) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, requirements" },
        { status: 400 }
      );
    }

    // Validate requirements
    if (!requirements.rowCount || requirements.rowCount < 1 || requirements.rowCount > 1000) {
      return NextResponse.json(
        { error: "rowCount must be between 1 and 1000" },
        { status: 400 }
      );
    }

    if (!Array.isArray(requirements.targetColumns) || requirements.targetColumns.length === 0) {
      return NextResponse.json(
        { error: "targetColumns must be a non-empty array" },
        { status: 400 }
      );
    }

    if (!requirements.dataType || requirements.dataType.trim().length === 0) {
      return NextResponse.json(
        { error: "dataType is required" },
        { status: 400 }
      );
    }

    // Get table information
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get('tableId');

    if (!tableId) {
      return NextResponse.json(
        { error: "tableId is required" },
        { status: 400 }
      );
    }

    // Get user's organization
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!userOrg) {
      return NextResponse.json(
        { error: "User organization not found" },
        { status: 404 }
      );
    }

    // Create job in database
    const { data: job, error: jobError } = await supabase
      .from('ai_generation_jobs')
      .insert({
        user_id: user.id,
        table_id: tableId,
        organization_id: userOrg.organization_id,
        status: 'pending',
        requirements,
        total_records: requirements.rowCount,
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Error creating job:', jobError);
      return NextResponse.json(
        { error: "Failed to create generation job" },
        { status: 500 }
      );
    }

    console.log('Generation job created:', job.id);

    // Start generation in background
    const firecrawlKey = process.env.FIRECRAWL_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const serpApiKey = process.env.SERP_API_KEY;

    if (!firecrawlKey || !geminiKey) {
      const missingKeys = [];
      if (!firecrawlKey) missingKeys.push('FIRECRAWL_KEY');
      if (!geminiKey) missingKeys.push('GEMINI_API_KEY');
      
      const errorMsg = `Missing required API keys: ${missingKeys.join(', ')}`;
      console.error('[Generate]', errorMsg);
      
      // Update job status to failed
      await supabase
        .from('ai_generation_jobs')
        .update({
          status: 'failed',
          error_message: errorMsg,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);
      
      return NextResponse.json(
        { error: errorMsg },
        { status: 500 }
      );
    }

    // Warn if SerpAPI key is missing (will use fallback)
    if (!serpApiKey) {
      console.warn('[Generate] SERP_API_KEY not found - will use Firecrawl search fallback');
    }

    // Start generation in background
    try {
      console.log('[Generate] Importing DataGenerationOrchestrator...');
      const { DataGenerationOrchestrator } = await import('@/lib/services/enrichment/DataGenerationOrchestrator');
      
      console.log('[Generate] Creating orchestrator instance...');
      const orchestrator = new DataGenerationOrchestrator(
        firecrawlKey,
        geminiKey,
        serpApiKey
      );
      
      console.log('[Generate] Starting background generation...');
      // Start in background without awaiting
      orchestrator.startGeneration(
        job.id,
        tableId,
        user.id,
        userOrg.organization_id,
        requirements
      ).catch(error => {
        console.error('[Generate] Background generation failed:', error);
        console.error('[Generate] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        // Update job status to failed
        supabase
          .from('ai_generation_jobs')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString(),
          })
          .eq('id', job.id)
          .then(() => console.log('[Generate] Job marked as failed'));
      });

      console.log('[Generate] Background generation started for job:', job.id);

    } catch (importError) {
      console.error('[Generate] Failed to load orchestrator:', importError);
      console.error('[Generate] Error details:', importError instanceof Error ? importError.message : 'Unknown');
      console.error('[Generate] Error stack:', importError instanceof Error ? importError.stack : 'No stack trace');
      
      // Update job status to failed
      await supabase
        .from('ai_generation_jobs')
        .update({
          status: 'failed',
          error_message: importError instanceof Error ? importError.message : 'Failed to initialize data generation system',
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      return NextResponse.json(
        { error: importError instanceof Error ? importError.message : "Failed to initialize data generation system" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId: job.id,
      sessionId,
      estimatedTime: Math.ceil(requirements.rowCount * 10), // 10 seconds per record estimate
      message: "データ生成プロセスを開始しました。AIがビジネスデータを生成しています。",
    });

  } catch (error) {
    console.error("Error starting enrichment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get job status
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required" },
        { status: 400 }
      );
    }

    // Authenticate user with proper server client
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

    // Parse sessionId from jobId
    const sessionId = jobId.split('_')[1];

    // Get session and job status
    const { data: session, error: sessionError } = await supabase
      .from('ai_enrichment_sessions')
      .select(`
        id,
        status,
        records_generated,
        records_completed,
        started_at,
        completed_at,
        error_message,
        ai_enrichment_records (
          id,
          field_name,
          confidence_score,
          validation_status,
          created_at
        )
      `)
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Job not found or access denied" },
        { status: 404 }
      );
    }

    // Calculate progress
    const progress = session.records_generated > 0
      ? (session.records_completed / session.records_generated) * 100
      : 0;

    const validatedRecords = session.ai_enrichment_records?.filter(r => r.validation_status === 'validated').length || 0;

    return NextResponse.json({
      jobId,
      status: session.status,
      progress: Math.round(progress),
      totalRecords: session.records_generated,
      completedRecords: session.records_completed,
      validatedRecords,
      startTime: session.started_at,
      endTime: session.completed_at,
      errorMessage: session.error_message,
    });

  } catch (error) {
    console.error("Error getting job status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}