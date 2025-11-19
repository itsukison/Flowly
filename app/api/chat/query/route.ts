import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processAIQuery } from "@/lib/ai/geminiChat";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log("[API] Chat query endpoint hit");
    const { tableId, message, conversationHistory, selectedRowIds, selectedRowSummary } = await request.json();
    console.log("[API] Request data:", { tableId, message, selectedRowsCount: selectedRowIds?.length || 0 });

    if (!tableId || !message) {
      console.log("[API] Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length > 500) {
      console.log("[API] Message too long");
      return NextResponse.json(
        { error: "Message too long (max 500 characters)" },
        { status: 400 }
      );
    }

    console.log("[API] Creating Supabase client...");
    const supabase = await createClient();

    // Get user
    console.log("[API] Getting user...");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("[API] User:", user?.id);

    if (!user) {
      console.log("[API] No user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    console.log("[API] Getting user profile...");
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("current_organization_id")
      .eq("id", user.id)
      .single();
    
    console.log("[API] User profile:", userProfile, "Error:", profileError);

    if (!userProfile || !userProfile.current_organization_id) {
      console.log("[API] User profile not found or no organization");
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Verify table belongs to user's organization
    console.log("[API] Getting table...");
    const { data: table, error: tableError } = await supabase
      .from("tables")
      .select("*")
      .eq("id", tableId)
      .eq("organization_id", userProfile.current_organization_id)
      .single();
    
    console.log("[API] Table:", table?.name, "Error:", tableError);

    if (!table) {
      console.log("[API] Table not found");
      return NextResponse.json(
        { error: "Table not found or access denied" },
        { status: 404 }
      );
    }

    // Process the query with AI
    console.log("[API] Processing AI query...");
    const response = await processAIQuery({
      tableId,
      tableName: table.name,
      message,
      conversationHistory: conversationHistory || [],
      organizationId: userProfile.current_organization_id,
      selectedRowIds,
      selectedRowSummary,
    });

    console.log("[API] AI response:", response.type);
    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] CAUGHT ERROR:", error);
    console.error("[API] Error stack:", error instanceof Error ? error.stack : "No stack");
    
    // Return detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("[API] Error details:", errorMessage);
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
