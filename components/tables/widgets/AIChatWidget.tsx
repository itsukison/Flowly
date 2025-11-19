"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Send,
  Loader2,
  MessageSquare,
  Zap,
  CheckCircle2,
  ArrowRight,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AIChatWidgetProps {
  tableId: string;
  tableName: string;
  onApplyFilter: (filters: any) => void;
  onClearFilter: () => void;
  onApplySort: (columnName: string, descending: boolean) => void;
  onClearSort: () => void;
  columns: any[];
  onEnrichmentComplete: () => void;
  selectedRows?: any[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "table" | "error" | "plan";
  data?: any;
  plan?: {
    row_count: number;
    data_description: string;
    target_columns: string[];
    new_columns: string[];
    target_selected_rows?: boolean;
  };
}

export function AIChatWidget({
  tableId,
  tableName,
  onApplyFilter,
  onClearFilter,
  onApplySort,
  onClearSort,
  columns,
  onEnrichmentComplete,
  selectedRows = [],
}: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"chat" | "agent">("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Agent Mode State
  const [jobId, setJobId] = useState<string | null>(null);
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  const [generationProgress, setGenerationProgress] = useState({
    total: 0,
    completed: 0,
  });
  const [agentStatus, setAgentStatus] = useState<
    "idle" | "planning" | "generating" | "complete"
  >("idle");
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, progressMessages]);

  // Cleanup poll interval
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Initial welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `こんにちは！「${tableName}」について何でも聞いてください。\n\n例：\n• 「東京の顧客を表示して」\n• 「GMVが100万以上の会社は？」`,
          type: "text",
        },
      ]);
    }
  }, [isOpen, tableName, messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || isComposing) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      if (mode === "chat") {
        await handleChatMode(userMessage);
      } else {
        await handleAgentMode(userMessage);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "エラーが発生しました。もう一度お試しください。",
          type: "error",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatMode = async (userMessage: Message) => {
    // Build selected rows context
    const selectedRowIds = selectedRows.map((row) => row.original.id);
    const selectedRowSummary =
      selectedRows.length > 0
        ? selectedRows
            .slice(0, 3)
            .map((row) => {
              const data = row.original;
              return data.company || data.name || data.email || data.id;
            })
            .join(", ") + (selectedRows.length > 3 ? "..." : "")
        : undefined;

    const response = await fetch("/api/chat/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableId,
        message: userMessage.content,
        conversationHistory: messages.slice(-10),
        selectedRowIds: selectedRowIds.length > 0 ? selectedRowIds : undefined,
        selectedRowSummary,
      }),
    });

    if (!response.ok) throw new Error("Failed to send message");

    const data = await response.json();

    // Handle sort_table function call
    if (data.functionCalled === "sort_table" && data.functionArgs) {
      const { column, descending = true } = data.functionArgs;
      onApplySort(column, descending);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `テーブルを${column}で${
            descending ? "降順" : "昇順"
          }にソートしました`,
          type: "text",
        },
      ]);
    }
    // Only apply filters if query_records was called AND it has filters
    else if (
      data.functionCalled === "query_records" &&
      data.functionArgs?.filters
    ) {
      const filters = data.functionArgs.filters;

      // Only apply if filters object has at least one filter
      if (Object.keys(filters).length > 0) {
        onApplyFilter(filters);

        const filterList = Object.entries(filters)
          .map(([k, v]) => `• ${k}: ${v}`)
          .join("\n");

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `フィルタを適用しました：\n${filterList}`,
            type: "text",
          },
        ]);
      } else {
        // No filters to apply, just show the result
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.content,
            type: data.type,
            data: data.data,
          },
        ]);
      }
    } else {
      // For all other functions (get_top_records, aggregate_data, etc.), just display results
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.content,
          type: data.type,
          data: data.data,
        },
      ]);
    }
  };

  const handleAgentMode = async (userMessage: Message) => {
    // Build selected rows context
    const selectedRowIds = selectedRows.map((row) => row.original.id);

    // Step 1: Parse intent
    const response = await fetch("/api/chat/agent/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage.content,
        tableId,
        selectedRowIds: selectedRowIds.length > 0 ? selectedRowIds : undefined,
      }),
    });

    if (!response.ok) throw new Error("Failed to parse agent request");

    const parsed = await response.json();

    if (!parsed.is_generation_request) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            parsed.clarification_needed ||
            "データの生成や拡充について指示してください。",
          type: "text",
        },
      ]);
      return;
    }

    if (parsed.clarification_needed) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `もう少し詳しく教えてください：${parsed.clarification_needed}`,
          type: "text",
        },
      ]);
      return;
    }

    // Step 2: Show Plan for confirmation
    const isEnrichment = parsed.target_selected_rows && selectedRows.length > 0;
    const rowCount = isEnrichment
      ? selectedRows.length
      : parsed.row_count || 10;

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: isEnrichment
          ? "選択された行を以下の内容で拡充しますか？"
          : "以下の内容でデータを生成しますか？",
        type: "plan",
        plan: {
          row_count: rowCount,
          data_description: parsed.data_description,
          target_columns: parsed.target_columns,
          new_columns: parsed.new_columns,
          target_selected_rows: isEnrichment,
        },
      },
    ]);
    setAgentStatus("planning");
  };

  const startGeneration = async (plan: any) => {
    setAgentStatus("generating");
    setIsLoading(true);

    const requirements = {
      rowCount: plan.row_count,
      targetColumns: [...plan.target_columns, ...plan.new_columns],
      dataType: plan.data_description,
      specifications: "",
      // Pass selected row IDs if this is an enrichment operation
      targetRowIds: plan.target_selected_rows
        ? selectedRows.map((row) => row.original.id)
        : undefined,
    };

    try {
      const response = await fetch(
        `/api/enrichment/generate?tableId=${tableId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: `agent_${Date.now()}`,
            requirements,
            isEnrichment: plan.target_selected_rows || false,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to start generation");

      const { jobId } = await response.json();
      setJobId(jobId);

      // Start Polling
      pollIntervalRef.current = setInterval(async () => {
        const progressRes = await fetch(`/api/enrichment/progress/${jobId}`);
        if (!progressRes.ok) return;

        const progressData = await progressRes.json();

        if (progressData.message) {
          setProgressMessages((prev) => {
            // Dedupe messages roughly
            if (prev[prev.length - 1] !== progressData.message) {
              return [...prev, progressData.message].slice(-50);
            }
            return prev;
          });
        }

        setGenerationProgress({
          total: progressData.totalRecords || plan.row_count,
          completed: progressData.completedRecords || 0,
        });

        if (progressData.status === "completed") {
          clearInterval(pollIntervalRef.current!);
          await handleInsert(jobId);
        } else if (progressData.status === "failed") {
          clearInterval(pollIntervalRef.current!);
          setAgentStatus("idle");
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `エラーが発生しました: ${progressData.errorMessage}`,
              type: "error",
            },
          ]);
          setIsLoading(false);
        }
      }, 1500);
    } catch (e) {
      console.error(e);
      setAgentStatus("idle");
      setIsLoading(false);
    }
  };

  const handleInsert = async (completedJobId: string) => {
    // Auto-insert without preview/confirmation
    try {
      // For enrichment (selected rows), update existing records
      if (completedJobId.includes("enrich-")) {
        // Get job results to get record IDs
        const progressRes = await fetch(
          `/api/enrichment/progress/${completedJobId}`
        );
        const progressData = await progressRes.json();

        // Get the record IDs that were enriched
        const selectedRecordIds = selectedRows.map((row) => row.original.id);

        // Call update-records endpoint to save enriched data
        const response = await fetch(
          `/api/enrichment/update-records/${completedJobId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              selectedRecordIds,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update records");
        }

        const result = await response.json();

        setAgentStatus("complete");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `データの拡充が完了しました！${result.successCount}件を更新しました。`,
            type: "text",
          },
        ]);
      } else {
        // For generation (new rows), insert as new records
        const previewRes = await fetch(
          `/api/enrichment/preview/${completedJobId}`
        );
        const previewData = await previewRes.json();
        const indices = previewData.records.map((r: any) => r.index);

        const response = await fetch(
          `/api/enrichment/insert/${completedJobId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tableId,
              selectedIndices: indices,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to insert records");
        }

        setAgentStatus("complete");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "データの生成と追加が完了しました！",
            type: "text",
          },
        ]);
      }

      onEnrichmentComplete();
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "データの保存に失敗しました。",
          type: "error",
        },
      ]);
    } finally {
      setIsLoading(false);
      setJobId(null);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          data-grid-popover
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed bottom-6 right-6 w-14 h-14 bg-black rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-50 group"
        >
          <div className="relative w-8 h-8">
            <Image
              src="/logo_white.png"
              alt="AI"
              fill
              className="object-contain"
            />
          </div>
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full animate-pulse border-2 border-white" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          data-grid-popover
          className="fixed bottom-6 right-6 w-[520px] h-[560px] bg-white rounded-2xl shadow-2xl border border-[#E4E4E7] flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-5 fade-in duration-200 font-sans"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E4E4E7] bg-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center p-1">
                <Image
                  src="/logo_white.png"
                  alt="AI"
                  width={16}
                  height={16}
                  className="object-contain"
                />
              </div>
              <span className="font-semibold text-sm">Flowly AI</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col min-h-0 bg-[#FAFAFA]">
            <div
              className="flex-1 overflow-y-auto p-4 space-y-4"
              ref={scrollRef}
            >
              {/* Messages */}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex w-full",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "text-sm",
                      msg.role === "user"
                        ? "max-w-[85%] rounded-2xl px-3 py-2 bg-gray-200 text-black-400 rounded-tr-none"
                        : "w-full text-gray-800"
                    )}
                  >
                    {msg.type === "plan" && msg.plan ? (
                      <div className="space-y-2.5">
                        <p className="text-sm">{msg.content}</p>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs space-y-2">
                          {msg.plan.target_selected_rows && (
                            <div className="mb-1 px-2 py-1 bg-gray-100 rounded text-gray-700 flex items-center gap-1 text-[10px] font-medium">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>選択された行を対象</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              {msg.plan.target_selected_rows
                                ? "対象行数:"
                                : "生成数:"}
                            </span>
                            <span className="font-medium text-gray-900">
                              {msg.plan.row_count}件
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block mb-1">
                              内容:
                            </span>
                            <span className="font-medium text-gray-900">
                              {msg.plan.data_description}
                            </span>
                          </div>
                          {msg.plan.new_columns.length > 0 && (
                            <div>
                              <span className="text-gray-500 block mb-1">
                                新規カラム:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {msg.plan.new_columns.map((c) => (
                                  <Badge
                                    key={c}
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-700"
                                  >
                                    {c}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {agentStatus === "planning" &&
                          i === messages.length - 1 && (
                            <Button
                              className="w-full h-8 text-xs bg-gray-900 hover:bg-gray-800 text-white transition-colors"
                              onClick={() => startGeneration(msg.plan)}
                            >
                              <Play className="w-3 h-3 mr-1.5" /> 開始
                            </Button>
                          )}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>
                </div>
              ))}

              {/* Agent Progress UI - High-end grayscale design */}
              {agentStatus === "generating" && (
                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-700" />
                      <span className="font-medium text-gray-900">生成中</span>
                    </div>
                    <span className="text-gray-500 font-mono text-[10px]">
                      {generationProgress.completed} /{" "}
                      {generationProgress.total}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-800 transition-all duration-300 ease-out"
                      style={{
                        width: `${
                          (generationProgress.completed /
                            generationProgress.total) *
                          100
                        }%`,
                      }}
                    />
                  </div>

                  <div className="h-20 overflow-y-auto bg-gray-50/50 rounded border border-gray-100 p-2 space-y-1">
                    {progressMessages.slice(-5).map((m, idx) => (
                      <div
                        key={idx}
                        className="text-[10px] text-gray-600 flex items-start gap-1.5 font-mono"
                      >
                        <span className="text-gray-400 shrink-0">›</span>
                        {m}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isLoading && agentStatus !== "generating" && (
                <div className="flex justify-start">
                  <div className="px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-[#E4E4E7]">
              {/* Selected rows indicator - subtle */}
              {selectedRows.length > 0 && (
                <div className="mb-1.5 px-1.5 py-0.5 text-[10px] text-gray-500 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>{selectedRows.length}行選択中</span>
                </div>
              )}

              <div className="relative flex items-center gap-2">
                {/* Mode Toggle at left */}
                <div className="flex items-center bg-gray-100 rounded-full p-0.5">
                  <button
                    onClick={() => setMode("chat")}
                    className={cn(
                      "p-1.5 rounded-full transition-all",
                      mode === "chat"
                        ? "bg-white shadow-sm"
                        : "hover:bg-gray-200"
                    )}
                    title="チャットモード"
                  >
                    <MessageSquare
                      className={cn(
                        "w-3.5 h-3.5",
                        mode === "chat" ? "text-black" : "text-gray-500"
                      )}
                    />
                  </button>
                  <button
                    onClick={() => setMode("agent")}
                    className={cn(
                      "p-1.5 rounded-full transition-all",
                      mode === "agent"
                        ? "bg-white shadow-sm"
                        : "hover:bg-gray-200"
                    )}
                    title="エージェントモード"
                  >
                    <Zap
                      className={cn(
                        "w-3.5 h-3.5",
                        mode === "agent" ? "text-black" : "text-gray-500"
                      )}
                    />
                  </button>
                </div>

                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isComposing && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  placeholder={
                    mode === "chat"
                      ? "質問や指示を入力..."
                      : "例: 日本のEC企業を5件生成して"
                  }
                  className="flex-1 pr-10 rounded-full bg-[#F4F4F5] border-transparent focus:bg-white focus:border-[#E4E4E7] transition-all text-sm"
                  disabled={agentStatus === "generating" || isLoading}
                />
                <Button
                  size="icon"
                  className="absolute right-1 h-8 w-8 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900"
                  onClick={handleSend}
                  disabled={
                    !input.trim() || isLoading || agentStatus === "generating"
                  }
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
