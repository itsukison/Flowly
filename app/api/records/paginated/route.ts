import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get("tableId");
    const page = parseInt(searchParams.get("page") || "0");
    const pageSize = parseInt(searchParams.get("pageSize") || "100");

    if (!tableId) {
      return NextResponse.json(
        { error: "Missing tableId parameter" },
        { status: 400 }
      );
    }

    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data: records, error, count } = await supabase
      .from("records")
      .select("*", { count: "exact" })
      .eq("table_id", tableId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching paginated records:", error);
      return NextResponse.json(
        { error: "Failed to fetch records" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      records: records || [],
      total: count || 0,
      page,
      pageSize,
      hasMore: count ? from + records.length < count : false,
    });
  } catch (error) {
    console.error("Error in paginated records API:", error);
    return NextResponse.json(
      { error: "Failed to fetch records" },
      { status: 500 }
    );
  }
}
