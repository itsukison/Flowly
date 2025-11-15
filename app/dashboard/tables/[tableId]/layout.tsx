import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TableLayoutClient from "@/components/tables/core/TableLayoutClient";

export default async function TableLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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

  return <TableLayoutClient table={table}>{children}</TableLayoutClient>;
}
