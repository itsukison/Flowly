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

/**
 * Get date range boundaries
 */
function getDateRange(range: string): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "yesterday":
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case "this_week":
      const dayOfWeek = now.getDay();
      start.setDate(now.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "last_week":
      const lastWeekStart = new Date(now);
      lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
      lastWeekStart.setHours(0, 0, 0, 0);
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      lastWeekEnd.setHours(23, 59, 59, 999);
      return { start: lastWeekStart, end: lastWeekEnd };
    case "this_month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "last_month":
      start.setMonth(now.getMonth() - 1);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth());
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    case "this_year":
      start.setMonth(0);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "last_year":
      start.setFullYear(now.getFullYear() - 1);
      start.setMonth(0);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(now.getFullYear() - 1);
      end.setMonth(11);
      end.setDate(31);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      throw new Error(`Invalid date range: ${range}`);
  }

  return { start, end };
}

/**
 * Aggregate numeric data with optional grouping and date filtering
 */
export async function aggregateData(
  tableId: string,
  organizationId: string,
  field: string,
  operation: "sum" | "avg" | "max" | "min" | "count",
  groupBy?: string,
  dateRange?: string,
  dateField: string = "created_at"
): Promise<string> {
  const supabase = await createClient();

  // Get all records
  let query = supabase
    .from("records")
    .select("*")
    .eq("table_id", tableId)
    .eq("organization_id", organizationId);

  // Apply date filter if specified
  if (dateRange) {
    const { start, end } = getDateRange(dateRange);
    query = query
      .gte(dateField, start.toISOString())
      .lte(dateField, end.toISOString());
  }

  const { data: records, error } = await query;

  if (error || !records || records.length === 0) {
    return "データが見つかりませんでした。";
  }

  // Extract numeric values from records
  const getFieldValue = (record: any): number | null => {
    let value: any;
    if (["name", "email", "company", "status"].includes(field)) {
      value = record[field];
    } else if (record.data && typeof record.data === "object") {
      value = (record.data as Record<string, any>)[field];
    }
    
    const numValue = parseFloat(value);
    return isNaN(numValue) ? null : numValue;
  };

  const getGroupValue = (record: any): string => {
    if (!groupBy) return "all";
    
    if (["name", "email", "company", "status"].includes(groupBy)) {
      return record[groupBy] || "未設定";
    } else if (record.data && typeof record.data === "object") {
      return (record.data as Record<string, any>)[groupBy] || "未設定";
    }
    return "未設定";
  };

  // Group records
  const groups: Record<string, number[]> = {};
  records.forEach((record) => {
    const groupValue = getGroupValue(record);
    const fieldValue = getFieldValue(record);
    
    if (fieldValue !== null) {
      if (!groups[groupValue]) {
        groups[groupValue] = [];
      }
      groups[groupValue].push(fieldValue);
    }
  });

  // Calculate aggregations
  const results: string[] = [];
  
  Object.entries(groups).forEach(([groupName, values]) => {
    if (values.length === 0) return;

    let result: number;
    switch (operation) {
      case "sum":
        result = values.reduce((a, b) => a + b, 0);
        break;
      case "avg":
        result = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case "max":
        result = Math.max(...values);
        break;
      case "min":
        result = Math.min(...values);
        break;
      case "count":
        result = values.length;
        break;
    }

    const formattedResult = operation === "count" 
      ? `${result}件`
      : result.toLocaleString("ja-JP");

    if (groupBy) {
      results.push(`${groupName}: ${formattedResult}`);
    } else {
      const operationLabel = {
        sum: "合計",
        avg: "平均",
        max: "最大",
        min: "最小",
        count: "件数",
      }[operation];
      
      const dateRangeLabel = dateRange ? ` (${dateRange})` : "";
      results.push(`${field}の${operationLabel}${dateRangeLabel}: ${formattedResult}`);
    }
  });

  if (results.length === 0) {
    return `${field}の数値データが見つかりませんでした。`;
  }

  if (groupBy) {
    const operationLabel = {
      sum: "合計",
      avg: "平均",
      max: "最大",
      min: "最小",
      count: "件数",
    }[operation];
    return `${groupBy}別の${field}${operationLabel}：\n${results.join("\n")}`;
  }

  return results[0];
}

/**
 * Query records with date range filter
 */
export async function queryWithDateRange(
  tableId: string,
  organizationId: string,
  dateRange: string,
  dateField: string = "created_at",
  filters: QueryFilters = {},
  limit: number = 50,
  orderBy?: string
): Promise<QueryResult> {
  const supabase = await createClient();
  const { start, end } = getDateRange(dateRange);

  let query = supabase
    .from("records")
    .select("*")
    .eq("table_id", tableId)
    .eq("organization_id", organizationId)
    .gte(dateField, start.toISOString())
    .lte(dateField, end.toISOString());

  // Apply additional filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (["name", "email", "company", "status"].includes(key)) {
        query = query.eq(key, value);
      } else {
        query = query.contains("data", { [key]: value });
      }
    }
  });

  // Apply ordering
  if (orderBy) {
    query = query.order(orderBy, { ascending: false });
  } else {
    query = query.order(dateField, { ascending: false });
  }

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
 * Get top N records sorted by a numeric field
 */
export async function getTopRecords(
  tableId: string,
  organizationId: string,
  field: string,
  limit: number = 10,
  dateRange?: string,
  dateField: string = "created_at",
  ascending: boolean = false
): Promise<QueryResult> {
  const supabase = await createClient();

  let query = supabase
    .from("records")
    .select("*")
    .eq("table_id", tableId)
    .eq("organization_id", organizationId);

  // Apply date filter if specified
  if (dateRange) {
    const { start, end } = getDateRange(dateRange);
    query = query
      .gte(dateField, start.toISOString())
      .lte(dateField, end.toISOString());
  }

  const { data: records, error } = await query;

  if (error || !records || records.length === 0) {
    return { columns: [], rows: [] };
  }

  // Extract and sort by numeric field
  const recordsWithValue = records
    .map((record) => {
      let value: any;
      if (["name", "email", "company", "status"].includes(field)) {
        value = record[field as keyof typeof record];
      } else if (record.data && typeof record.data === "object") {
        value = (record.data as Record<string, any>)[field];
      }
      
      const numValue = parseFloat(value);
      return {
        record,
        value: isNaN(numValue) ? null : numValue,
      };
    })
    .filter((item) => item.value !== null)
    .sort((a, b) => ascending ? a.value! - b.value! : b.value! - a.value!)
    .slice(0, limit);

  if (recordsWithValue.length === 0) {
    return { columns: [], rows: [] };
  }

  // Get columns for formatting
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
    ...(columns || []).map((col) => ({
      id: col.name,
      label: col.label,
    })),
  ];

  const formattedRows = recordsWithValue.map(({ record }) => {
    const row: Record<string, any> = {
      name: record.name,
      email: record.email,
      company: record.company,
      status: record.status,
    };

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
