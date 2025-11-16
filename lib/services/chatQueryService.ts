import { createClient } from "@/lib/supabase/server";

export interface QueryFilters {
  [key: string]: any;
}

export interface QueryResult {
  columns: Array<{ id: string; label: string }>;
  rows: Array<Record<string, any>>;
}

/**
 * Get table context (schema + sample data)
 */
export async function getTableContext(tableId: string, organizationId: string) {
  const supabase = await createClient();

  // Get columns
  const { data: columns } = await supabase
    .from("table_columns")
    .select("*")
    .eq("table_id", tableId)
    .order("display_order", { ascending: true });

  // Get statuses
  const { data: statuses } = await supabase
    .from("table_statuses")
    .select("*")
    .eq("table_id", tableId)
    .order("display_order", { ascending: true });

  // Get sample data (first 5 rows)
  const { data: sampleRecords } = await supabase
    .from("records")
    .select("*")
    .eq("table_id", tableId)
    .eq("organization_id", organizationId)
    .limit(5);

  return {
    columns: columns || [],
    statuses: statuses || [],
    sampleRecords: sampleRecords || [],
  };
}

/**
 * Query records with filters
 */
export async function queryRecords(
  tableId: string,
  organizationId: string,
  filters: QueryFilters = {},
  limit: number = 50,
  orderBy?: string
): Promise<QueryResult> {
  const supabase = await createClient();

  let query = supabase
    .from("records")
    .select("*")
    .eq("table_id", tableId)
    .eq("organization_id", organizationId);

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value === null) {
      query = query.is(key, null);
    } else if (["name", "email", "company", "status"].includes(key)) {
      // Direct field filter
      query = query.eq(key, value);
    } else {
      // JSONB field filter
      query = query.contains("data", { [key]: value });
    }
  });

  // Apply ordering
  if (orderBy) {
    query = query.order(orderBy, { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  // Apply limit
  query = query.limit(limit);

  const { data: records, error } = await query;

  if (error) {
    throw new Error(`Query failed: ${error.message}`);
  }

  // Get columns for formatting
  const { data: columns } = await supabase
    .from("table_columns")
    .select("*")
    .eq("table_id", tableId)
    .order("display_order", { ascending: true });

  // Format results
  const formattedColumns = [
    { id: "name", label: "名前" },
    { id: "email", label: "メール" },
    { id: "company", label: "会社名" },
    { id: "status", label: "ステータス" },
    ...(columns || []).map((col) => ({
      id: col.name,
      label: col.label,
    })),
  ];

  const formattedRows = (records || []).map((record) => {
    const row: Record<string, any> = {
      name: record.name,
      email: record.email,
      company: record.company,
      status: record.status,
    };

    // Add JSONB fields
    if (record.data && typeof record.data === "object") {
      Object.entries(record.data as Record<string, any>).forEach(([key, value]) => {
        row[key] = value;
      });
    }

    return row;
  });

  return {
    columns: formattedColumns,
    rows: formattedRows,
  };
}

/**
 * Get statistics about the table
 */
export async function getStatistics(
  tableId: string,
  organizationId: string,
  metric: "count" | "count_by_status" | "count_by_field" | "missing_data",
  field?: string
): Promise<string> {
  const supabase = await createClient();

  if (metric === "count") {
    const { count } = await supabase
      .from("records")
      .select("*", { count: "exact", head: true })
      .eq("table_id", tableId)
      .eq("organization_id", organizationId);

    return `現在、${count}件のレコードがあります。`;
  }

  if (metric === "count_by_status") {
    const { data: records } = await supabase
      .from("records")
      .select("status")
      .eq("table_id", tableId)
      .eq("organization_id", organizationId);

    const statusCounts: Record<string, number> = {};
    (records || []).forEach((record) => {
      const status = record.status || "未設定";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const result = Object.entries(statusCounts)
      .map(([status, count]) => `${status}: ${count}件`)
      .join("\n");

    return `ステータス別の件数：\n${result}`;
  }

  if (metric === "missing_data" && field) {
    const { count } = await supabase
      .from("records")
      .select("*", { count: "exact", head: true })
      .eq("table_id", tableId)
      .eq("organization_id", organizationId)
      .is(field, null);

    return `${field}が未入力のレコードは${count}件あります。`;
  }

  return "統計情報を取得できませんでした。";
}

/**
 * Find duplicate records
 */
export async function findDuplicates(
  tableId: string,
  organizationId: string,
  field: string
): Promise<QueryResult> {
  const supabase = await createClient();

  // Get all records
  const { data: records } = await supabase
    .from("records")
    .select("*")
    .eq("table_id", tableId)
    .eq("organization_id", organizationId);

  if (!records) {
    return { columns: [], rows: [] };
  }

  // Find duplicates
  const valueMap: Record<string, any[]> = {};

  records.forEach((record) => {
    let value: any;

    if (["name", "email", "company", "status"].includes(field)) {
      value = (record as any)[field];
    } else if (record.data && typeof record.data === "object") {
      value = (record.data as Record<string, any>)[field];
    }

    if (value) {
      if (!valueMap[value]) {
        valueMap[value] = [];
      }
      valueMap[value].push(record);
    }
  });

  // Filter to only duplicates
  const duplicates = Object.entries(valueMap)
    .filter(([_, records]) => records.length > 1)
    .flatMap(([_, records]) => records);

  if (duplicates.length === 0) {
    return { columns: [], rows: [] };
  }

  // Format results
  const { data: columns } = await supabase
    .from("table_columns")
    .select("*")
    .eq("table_id", tableId)
    .order("display_order", { ascending: true });

  const formattedColumns = [
    { id: "name", label: "名前" },
    { id: "email", label: "メール" },
    { id: "company", label: "会社名" },
    { id: field, label: field },
  ];

  const formattedRows = duplicates.map((record) => {
    const row: Record<string, any> = {
      name: record.name,
      email: record.email,
      company: record.company,
    };

    if (["name", "email", "company", "status"].includes(field)) {
      row[field] = (record as any)[field];
    } else if (record.data && typeof record.data === "object") {
      row[field] = (record.data as Record<string, any>)[field];
    }

    return row;
  });

  return {
    columns: formattedColumns,
    rows: formattedRows,
  };
}

/**
 * Search records with full-text search
 */
export async function searchRecords(
  tableId: string,
  organizationId: string,
  query: string
): Promise<QueryResult> {
  const supabase = await createClient();

  // Search in name, email, company fields
  const { data: records } = await supabase
    .from("records")
    .select("*")
    .eq("table_id", tableId)
    .eq("organization_id", organizationId)
    .or(`name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`)
    .limit(50);

  if (!records || records.length === 0) {
    return { columns: [], rows: [] };
  }

  // Format results
  const { data: columns } = await supabase
    .from("table_columns")
    .select("*")
    .eq("table_id", tableId)
    .order("display_order", { ascending: true });

  const formattedColumns = [
    { id: "name", label: "名前" },
    { id: "email", label: "メール" },
    { id: "company", label: "会社名" },
    { id: "status", label: "ステータス" },
  ];

  const formattedRows = records.map((record) => ({
    name: record.name,
    email: record.email,
    company: record.company,
    status: record.status,
  }));

  return {
    columns: formattedColumns,
    rows: formattedRows,
  };
}
