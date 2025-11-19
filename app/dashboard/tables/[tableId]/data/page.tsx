import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DiceTableView from "@/components/tables/views/DiceTableView";

export default async function DataPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const supabase = await createClient();
  const { tableId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: table, error: tableError } = await supabase
    .from("tables")
    .select("*")
    .eq("id", tableId)
    .single();

  if (tableError || !table) {
    redirect("/dashboard");
  }

  const { data: columns } = await supabase
    .from("table_columns")
    .select("*")
    .eq("table_id", tableId)
    .order("display_order", { ascending: true });

  const { data: statuses } = await supabase
    .from("table_statuses")
    .select("*")
    .eq("table_id", tableId)
    .order("display_order", { ascending: true });

  // Fetch initial records with pagination (100 records)
  const PAGE_SIZE = 100;
  
  const { data: records, count } = await supabase
    .from("records")
    .select("*", { count: "exact" })
    .eq("table_id", tableId)
    .order("created_at", { ascending: false })
    .range(0, PAGE_SIZE - 1);

  return (
    <DiceTableView
      table={table}
      columns={columns || []}
      statuses={statuses || []}
      records={records || []}
      totalRecords={count || 0}
      pageSize={PAGE_SIZE}
    />
  );
}
