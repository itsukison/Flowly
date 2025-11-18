import { NextRequest, NextResponse } from "next/server";
import { AIConversationService } from "@/services/ai/AIConversationService";
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
    const { sessionId, userInput, state } = body;

    if (!sessionId || !userInput || !state) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, userInput, state" },
        { status: 400 }
      );
    }

    // Validate input length
    if (typeof userInput !== 'string' || userInput.trim().length === 0) {
      return NextResponse.json(
        { error: "userInput must be a non-empty string" },
        { status: 400 }
      );
    }

    if (userInput.length > 1000) {
      return NextResponse.json(
        { error: "userInput must be less than 1000 characters" },
        { status: 400 }
      );
    }

    // Process user input (stateless - client manages state)
    const conversationService = new AIConversationService();
    const response = await conversationService.processUserInput({
      sessionId,
      userInput,
      state,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing AI conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}