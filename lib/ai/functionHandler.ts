import {
  queryRecords,
  getStatistics,
  findDuplicates,
  searchRecords,
  aggregateData,
  queryWithDateRange,
  getTopRecords,
  QueryResult,
} from "@/lib/services/chatQueryService";

interface FunctionResult {
  type: "text" | "table";
  content: string;
  data?: QueryResult;
}

export async function executeFunctionCall(
  functionName: string,
  args: any,
  tableId: string,
  organizationId: string
): Promise<FunctionResult> {
  try {
    switch (functionName) {
      case "query_records": {
        const { status, company, email, limit = 50, orderBy } = args;
        
        // Build filters object from individual parameters
        const filters: any = {};
        if (status) filters.status = status;
        if (company) filters.company = company;
        if (email) filters.email = email;
        
        const result = await queryRecords(
          tableId,
          organizationId,
          filters,
          Math.min(limit, 100), // Cap at 100
          orderBy
        );

        if (result.rows.length === 0) {
          return {
            type: "text",
            content: "条件に一致するレコードが見つかりませんでした。",
          };
        }

        return {
          type: "table",
          content: `${result.rows.length}件のレコードが見つかりました：`,
          data: result,
        };
      }

      case "get_statistics": {
        const { metric, field } = args;
        const result = await getStatistics(
          tableId,
          organizationId,
          metric,
          field
        );

        return {
          type: "text",
          content: result,
        };
      }

      case "find_duplicates": {
        const { field } = args;
        const result = await findDuplicates(tableId, organizationId, field);

        if (result.rows.length === 0) {
          return {
            type: "text",
            content: `${field}フィールドに重複は見つかりませんでした。`,
          };
        }

        return {
          type: "table",
          content: `${field}フィールドで${result.rows.length}件の重複が見つかりました：`,
          data: result,
        };
      }

      case "search_records": {
        const { query } = args;
        const result = await searchRecords(tableId, organizationId, query);

        if (result.rows.length === 0) {
          return {
            type: "text",
            content: `「${query}」に一致するレコードが見つかりませんでした。`,
          };
        }

        return {
          type: "table",
          content: `「${query}」で${result.rows.length}件のレコードが見つかりました：`,
          data: result,
        };
      }

      case "aggregate_data": {
        const { field, operation, groupBy, dateRange, dateField } = args;
        const result = await aggregateData(
          tableId,
          organizationId,
          field,
          operation,
          groupBy,
          dateRange,
          dateField
        );

        return {
          type: "text",
          content: result,
        };
      }

      case "query_with_date_range": {
        const { dateRange, dateField, status, limit = 50, orderBy } = args;
        const result = await queryWithDateRange(
          tableId,
          organizationId,
          dateRange,
          dateField,
          { status },
          Math.min(limit, 100),
          orderBy
        );

        if (result.rows.length === 0) {
          return {
            type: "text",
            content: "条件に一致するレコードが見つかりませんでした。",
          };
        }

        return {
          type: "table",
          content: `${result.rows.length}件のレコードが見つかりました：`,
          data: result,
        };
      }

      case "get_top_records": {
        const { field, limit = 10, dateRange, dateField, ascending = false } = args;
        const result = await getTopRecords(
          tableId,
          organizationId,
          field,
          Math.min(limit, 100),
          dateRange,
          dateField,
          ascending
        );

        if (result.rows.length === 0) {
          return {
            type: "text",
            content: "レコードが見つかりませんでした。",
          };
        }

        const direction = ascending ? "最小" : "最大";
        return {
          type: "table",
          content: `${field}の${direction}値でソートした上位${result.rows.length}件：`,
          data: result,
        };
      }

      default:
        return {
          type: "text",
          content: "サポートされていない操作です。",
        };
    }
  } catch (error) {
    console.error("Function execution error:", error);
    return {
      type: "text",
      content: "エラーが発生しました。もう一度お試しください。",
    };
  }
}
