import { GoogleGenerativeAI, SchemaType, type FunctionDeclaration } from "@google/generative-ai";
import { getTableContext } from "@/lib/services/chatQueryService";
import { executeFunctionCall } from "@/lib/ai/functionHandler";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ProcessQueryParams {
  tableId: string;
  tableName: string;
  message: string;
  conversationHistory: Message[];
  organizationId: string;
  selectedRowIds?: string[];
  selectedRowSummary?: string;
}

interface AIResponse {
  type: "text" | "table";
  content: string;
  data?: {
    columns: Array<{ id: string; label: string }>;
    rows: Array<Record<string, any>>;
  };
  functionCalled?: string;
  functionArgs?: any;
}

// Function definitions for Gemini
const functions: FunctionDeclaration[] = [
  {
    name: "sort_table",
    description: "SORT the main table view by a column. Use when user wants to sort/order the table (e.g., '〜順にして', '〜でソート', '高い順', '低い順'). Map user's column name to actual column names from the table schema.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        column: {
          type: SchemaType.STRING,
          description: "Column name to sort by. Map user intent to actual column names (e.g., '売り上げ' → 'gmv', '会社名' → 'company', 'メール' → 'email'). Use the exact column names from the table schema.",
        },
        descending: {
          type: SchemaType.BOOLEAN,
          description: "Sort in descending order (high to low). true for '高い順'/'降順', false for '低い順'/'昇順'. Default: true",
        },
      },
      required: ["column"],
    },
  },
  {
    name: "query_records",
    description: "Query records and APPLY FILTERS to the main table view. Use ONLY when user explicitly wants to filter/view the table (e.g., '〜を表示して', '〜を見せて', '〜のレコードを表示'). Do NOT use for questions asking for specific information. Map user's natural language to actual column names from the table schema.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        filters: {
          type: SchemaType.OBJECT,
          description: "Dynamic filters object where keys are column names and values are filter values. Map user intent to actual column names (e.g., '会社名' → 'company', 'GMV' → 'gmv', 'ステータス' → 'status'). Use the exact column names from the table schema provided in the context.",
          properties: {}
        },
        limit: {
          type: SchemaType.NUMBER,
          description: "Maximum number of records to return (default: 50, max: 100)",
        },
        orderBy: {
          type: SchemaType.STRING,
          description: "Column to sort by (e.g., 'created_at', 'name')",
        },
      },
    },
  },
  {
    name: "get_statistics",
    description: "Get aggregate statistics about the table. Use this when user asks 'how many', 'count', or wants statistics.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        metric: {
          type: SchemaType.STRING,
          description: "Type of statistic: 'count' for total count, 'count_by_status' for breakdown by status, 'missing_data' for records with missing field",
        },
        field: {
          type: SchemaType.STRING,
          description: "Field name for field-specific metrics (required for 'missing_data')",
        },
      },
      required: ["metric"],
    },
  },
  {
    name: "find_duplicates",
    description: "Find potential duplicate records based on a specific field. Use when user asks about duplicates.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        field: {
          type: SchemaType.STRING,
          description: "Field to check for duplicates (e.g., 'email', 'phone', 'name')",
        },
      },
      required: ["field"],
    },
  },
  {
    name: "search_records",
    description: "Full-text search across name, email, and company fields. Use when user wants to find or search for something.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: "Search query text",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "aggregate_data",
    description: "Perform aggregation operations on numeric fields. Use when user asks for sum, average, max, min, highest, lowest, or total of numeric values. Can group by another field.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        field: {
          type: SchemaType.STRING,
          description: "The numeric field to aggregate (e.g., 'gmv', 'revenue', 'amount')",
        },
        operation: {
          type: SchemaType.STRING,
          format: "enum",
          description: "Aggregation operation: 'sum', 'avg', 'max', 'min', 'count'",
          enum: ["sum", "avg", "max", "min", "count"],
        },
        groupBy: {
          type: SchemaType.STRING,
          description: "Optional field to group results by (e.g., 'status', 'company')",
        },
        dateRange: {
          type: SchemaType.STRING,
          description: "Optional date range filter: 'today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year'",
        },
        dateField: {
          type: SchemaType.STRING,
          description: "Date field to filter on (default: 'created_at'). Can be 'created_at', 'updated_at', or custom date field",
        },
      },
      required: ["field", "operation"],
    },
  },
  {
    name: "query_with_date_range",
    description: "Query records filtered by date range. Use when user asks about records from specific time periods.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        dateRange: {
          type: SchemaType.STRING,
          description: "Date range: 'today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'last_year'",
        },
        dateField: {
          type: SchemaType.STRING,
          description: "Date field to filter on (default: 'created_at')",
        },
        status: {
          type: SchemaType.STRING,
          description: "Optional status filter",
        },
        limit: {
          type: SchemaType.NUMBER,
          description: "Maximum number of records to return (default: 50)",
        },
        orderBy: {
          type: SchemaType.STRING,
          description: "Column to sort by",
        },
      },
      required: ["dateRange"],
    },
  },
  {
    name: "get_top_records",
    description: "Get top N records sorted by a numeric field. Use when user asks for 'top', 'highest', 'best', 'largest' records.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        field: {
          type: SchemaType.STRING,
          description: "Numeric field to sort by (e.g., 'gmv', 'revenue', 'amount')",
        },
        limit: {
          type: SchemaType.NUMBER,
          description: "Number of top records to return (default: 10)",
        },
        dateRange: {
          type: SchemaType.STRING,
          description: "Optional date range filter: 'today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month'",
        },
        dateField: {
          type: SchemaType.STRING,
          description: "Date field to filter on (default: 'created_at')",
        },
        ascending: {
          type: SchemaType.BOOLEAN,
          description: "Sort ascending (lowest first) instead of descending (default: false)",
        },
      },
      required: ["field"],
    },
  },
];

export async function processAIQuery(
  params: ProcessQueryParams
): Promise<AIResponse> {
  try {
    const { tableId, tableName, message, conversationHistory, organizationId, selectedRowIds, selectedRowSummary } = params;

    console.log("[AI Chat] Processing query:", { tableId, tableName, message, selectedRowsCount: selectedRowIds?.length || 0 });

    // Get table context
    const context = await getTableContext(tableId, organizationId);
    console.log("[AI Chat] Table context:", { 
      columnsCount: context.columns.length, 
      statusesCount: context.statuses.length,
      sampleRecordsCount: context.sampleRecords.length 
    });

    // Build system prompt
    const systemPrompt = buildSystemPrompt(tableName, context, selectedRowIds, selectedRowSummary);

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    // Build conversation history for Gemini
    // Filter out any leading assistant messages (like welcome message)
    let filteredHistory = conversationHistory.slice(-10);
    
    // Remove leading assistant messages
    while (filteredHistory.length > 0 && filteredHistory[0].role === "assistant") {
      filteredHistory = filteredHistory.slice(1);
    }
    
    const history = filteredHistory.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));
    
    console.log("[AI Chat] History length:", history.length);

    // Start chat
    const chat = model.startChat({
      history,
      tools: [{ functionDeclarations: functions }],
    });

    // Send message
    console.log("[AI Chat] Sending message to Gemini...");
    const result = await chat.sendMessage(message);
    const response = result.response;
    console.log("[AI Chat] Received response from Gemini");

    // Check if function call was made
    const functionCall = response.functionCalls()?.[0];

    if (functionCall) {
      console.log("[AI Chat] Function called:", functionCall.name, functionCall.args);
      
      // Execute the function
      const functionResult = await executeFunctionCall(
        functionCall.name,
        functionCall.args,
        tableId,
        organizationId
      );

      console.log("[AI Chat] Function result:", { 
        type: functionResult.type, 
        hasData: !!functionResult.data 
      });

      // If function returned data, format as table response
      if (functionResult.type === "table" && functionResult.data) {
        return {
          type: "table",
          content: functionResult.content,
          data: functionResult.data,
          functionCalled: functionCall.name,
          functionArgs: functionCall.args,
        };
      }

      // Otherwise, send function result back to Gemini for natural language response
      const followUpResult = await chat.sendMessage([
        {
          functionResponse: {
            name: functionCall.name,
            response: { result: functionResult.content },
          },
        },
      ]);

      return {
        type: "text",
        content: followUpResult.response.text(),
        functionCalled: functionCall.name,
        functionArgs: functionCall.args,
      };
    }

    // No function call, return text response
    console.log("[AI Chat] No function call, returning text response");
    return {
      type: "text",
      content: response.text(),
    };
  } catch (error) {
    console.error("[AI Chat] Error in processAIQuery:", error);
    throw error;
  }
}

function buildSystemPrompt(
  tableName: string,
  context: {
    columns: any[];
    statuses: any[];
    sampleRecords: any[];
  },
  selectedRowIds?: string[],
  selectedRowSummary?: string
): string {
  const columnsList = context.columns
    .map((col) => `- ${col.label} (${col.name}): ${col.type}`)
    .join("\n");

  const statusesList = context.statuses
    .map((status) => `- ${status.name}`)
    .join("\n");

  const sampleDataText =
    context.sampleRecords.length > 0
      ? JSON.stringify(context.sampleRecords.slice(0, 3), null, 2)
      : "データがありません";

  // Add selected rows context if available
  const selectedRowsContext = selectedRowIds && selectedRowIds.length > 0
    ? `\n\n【重要】ユーザーは現在${selectedRowIds.length}行を選択しています${selectedRowSummary ? `：${selectedRowSummary}` : ''}。
「選択された」「この」「これら」などの言葉は、選択された行を指します。
選択された行に関する質問には、その行のデータのみを参照して回答してください。`
    : '';

  return `あなたは「${tableName}」というCRMテーブルのデータベースアシスタントです。

テーブルの構造：

カラム：
${columnsList}

ステータス：
${statusesList}

サンプルデータ（最初の3件）：
${sampleDataText}${selectedRowsContext}

ユーザーの質問に対して、以下のように対応してください：

【重要】関数の使い分け：
- sort_table: ユーザーが「テーブルをソートしたい」場合に使用
  例：「売り上げ高い順にして」「GMVでソート」「名前順に並べて」
- query_records: ユーザーが「テーブルにフィルタを適用して表示したい」場合のみ使用
  例：「東京の会社を表示して」「ステータスがActiveのレコードを見せて」
- その他の関数: ユーザーが「答えを知りたい」場合に使用（テーブルは変更しない）
  例：「最高のGMVは？」「何件ある？」「電話番号は何？」

1. 一般的な質問には直接答える
2. テーブルを**ソート**する必要がある場合は、sort_table関数を使用する
3. テーブルを**フィルタして表示**する必要がある場合のみ、query_records関数を使用する
4. 統計情報が必要な場合は、get_statistics関数を使用する
5. 検索が必要な場合は、search_records関数を使用する
6. 重複チェックが必要な場合は、find_duplicates関数を使用する
7. 数値の集計（合計、平均、最大、最小）が必要な場合は、aggregate_data関数を使用する
8. 特定の期間のデータが必要な場合は、query_with_date_range関数を使用する
9. トップN件や最高値のレコードが必要な場合は、get_top_records関数を使用する（答えを返すのみ、テーブルはソートしない）

【カラム名のマッピング重要】
sort_table、query_records関数を使用する際は、ユーザーの自然言語をテーブルの実際のカラム名にマッピングしてください：
- 日本語のカラムラベルを対応する英語のカラム名に変換する
- 例：「売り上げ」→「gmv」、「会社名」→「company」、「メール」→「email」、「ステータス」→「status」
- sort_tableのcolumnパラメータ、filtersオブジェクトのキーには必ず上記のカラムリストにある実際のカラム名（name）を使用する
- 例：sort_table(column: "gmv", descending: true)
- 例：filters: { "company": "東京", "status": "active" }

日付範囲の指定：
- 「今日」「本日」→ today
- 「昨日」→ yesterday
- 「今週」「今週中」→ this_week
- 「先週」「前週」→ last_week
- 「今月」「今月中」→ this_month
- 「先月」「前月」→ last_month
- 「今年」→ this_year
- 「去年」「昨年」→ last_year

数値集計の例：
- 「GMVの合計は？」→ aggregate_data(field: "gmv", operation: "sum")
- 「先週のGMVの合計は？」→ aggregate_data(field: "gmv", operation: "sum", dateRange: "last_week")
- 「会社別の売上合計は？」→ aggregate_data(field: "revenue", operation: "sum", groupBy: "company")
- 「最高のGMVは？」→ aggregate_data(field: "gmv", operation: "max")

トップレコードの例：
- 「GMVが最も高い会社は？」→ get_top_records(field: "gmv", limit: 1)
- 「先週GMVが高かった上位5社は？」→ get_top_records(field: "gmv", limit: 5, dateRange: "last_week")

常に簡潔で分かりやすい日本語で回答してください。
複数のレコードを表示する場合は、関数を呼び出してテーブル形式で表示してください。`;
}
