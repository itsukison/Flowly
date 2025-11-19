import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { message, tableId, selectedRowIds } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get table columns to help Gemini map user intent to existing columns
    const { data: columns } = await supabase
      .from("table_columns")
      .select("name, label, type")
      .eq("table_id", tableId);

    const columnsInfo = columns?.map(c => `${c.label} (${c.name})`).join(", ") || "";
    
    const selectedRowsContext = selectedRowIds && selectedRowIds.length > 0
      ? `\n\n【IMPORTANT】User has ${selectedRowIds.length} rows currently selected. 
If they say "enrich", "update", "add data to", "fill in", or "complete" without specifying row count, 
they are referring to the selected rows. Set "target_selected_rows" to true in this case.`
      : '';

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            is_generation_request: { type: SchemaType.BOOLEAN },
            row_count: { type: SchemaType.NUMBER },
            data_description: { type: SchemaType.STRING },
            target_columns: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            new_columns: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            target_selected_rows: { type: SchemaType.BOOLEAN },
            clarification_needed: { type: SchemaType.STRING }
          },
          required: ["is_generation_request"]
        }
      }
    });

    const prompt = `
    You are an AI agent helper that parses user requests for data generation or enrichment.
    
    Existing Table Columns: ${columnsInfo}${selectedRowsContext}

    User Request: "${message}"

    Analyze if this is a request to generate new data/records OR enrich existing selected rows.
    
    If yes (data generation/enrichment):
    1. Extract the number of rows (default to 10 if not specified but implied).
       - If user says "enrich selected" or similar and rows are selected, use the selected row count and set "target_selected_rows" to true
    2. Extract the description of data to generate/enrich (e.g., "Japanese IT companies", "contact information").
    3. Map requested fields to "target_columns" (use existing column names if possible).
    4. Identify "new_columns" that don't exist in the table.
    5. If the request is vague, set "clarification_needed".

    If no (e.g. just "hello" or "how are you"):
    - set "is_generation_request" to false.
    - set "clarification_needed" to a helpful response.
    `;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());

    return NextResponse.json(parsed);

  } catch (error) {
    console.error("Agent parse error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

