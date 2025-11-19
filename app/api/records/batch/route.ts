import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { updates } = await request.json();

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Invalid updates array" },
        { status: 400 }
      );
    }

    // Batch update all records
    const results = [];
    const errors = [];

    for (const update of updates) {
      const { id, changes } = update;

      if (!id || !changes) {
        errors.push({ id, error: "Missing id or changes" });
        continue;
      }

      const { data, error } = await supabase
        .from("records")
        .update({ ...changes, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating record ${id}:`, error);
        errors.push({ id, error: error.message });
      } else {
        results.push(data);
      }
    }

    return NextResponse.json({
      success: true,
      updated: results.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in batch update API:", error);
    return NextResponse.json(
      { error: "Failed to batch update records" },
      { status: 500 }
    );
  }
}
