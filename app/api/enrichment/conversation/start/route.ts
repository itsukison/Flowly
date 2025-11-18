import { NextRequest, NextResponse } from "next/server";
import { AIConversationService } from "@/services/ai/AIConversationService";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
    const { tableId, tableName, columns } = body;

    if (!tableId || !tableName || !columns) {
      return NextResponse.json(
        { error: "Missing required fields: tableId, tableName, columns" },
        { status: 400 }
      );
    }

    // Validate columns format
    if (!Array.isArray(columns) || columns.length === 0) {
      return NextResponse.json(
        { error: "Columns must be a non-empty array" },
        { status: 400 }
      );
    }

    // Verify user has access to the table
    const { data: table, error: tableError } = await supabase
      .from('tables')
      .select('id, organization_id')
      .eq('id', tableId)
      .single();

    if (tableError || !table) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }

    // Check if user belongs to the table's organization
    const { data: userOrg, error: orgError } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', table.organization_id)
      .single();

    if (orgError || !userOrg) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Start conversation
    const conversationService = new AIConversationService();
    const response = await conversationService.startConversation({
      tableId,
      tableName,
      columns,
      userId: user.id,
      organizationId: table.organization_id,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error starting AI conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}