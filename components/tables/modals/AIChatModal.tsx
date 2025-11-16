"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Column {
  id: string;
  name: string;
  label: string;
  type: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "table";
  data?: {
    columns: Array<{ id: string; label: string }>;
    rows: Array<Record<string, any>>;
  };
}

interface AIChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: string;
  tableName: string;
  columns: Column[];
}

export function AIChatModal({
  open,
  onOpenChange,
  tableId,
  tableName,
  columns,
}: AIChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Welcome message on open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `こんにちは！「${tableName}」テーブルについて何でも聞いてください。\n\n例えば：\n• 「リードは何件ありますか？」\n• 「東京の顧客を表示して」\n• 「メールアドレスが重複している人を探して」`,
          type: "text",
        },
      ]);
    }
  }, [open, tableName, messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId,
          message: userMessage.content,
          conversationHistory: messages.slice(-10), // Last 10 messages for context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.content,
        type: data.type,
        data: data.data,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `申し訳ございません。エラーが発生しました：${errorMessage}\n\nもう一度お試しください。`,
          type: "text",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };



  const handleClear = () => {
    setMessages([
      {
        role: "assistant",
        content: `こんにちは！「${tableName}」テーブルについて何でも聞いてください。\n\n例えば：\n• 「リードは何件ありますか？」\n• 「東京の顧客を表示して」\n• 「メールアドレスが重複している人を探して」`,
        type: "text",
      },
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[90vw] w-[90vw] h-[85vh] p-0 gap-0 flex flex-col" showCloseButton={false}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E4E4E7] shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#09090B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h2 className="text-base font-semibold text-[#09090B]">AIアシスタント</h2>
            <span className="px-2 py-0.5 text-[10px] bg-[#F4F4F5] text-[#71717B] rounded-full">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-[#71717B] hover:text-[#09090B]"
            >
              クリア
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    message.role === "user"
                      ? "bg-[#F4F4F5] text-[#09090B]"
                      : "bg-white border border-[#E4E4E7] text-[#09090B]"
                  }`}
                >
                  {message.type === "text" ? (
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  ) : message.type === "table" && message.data ? (
                    <div className="space-y-3">
                      {message.content && (
                        <p className="text-sm mb-3">{message.content}</p>
                      )}
                      {message.data.rows.length > 0 ? (
                        <>
                          <div className="overflow-x-auto rounded-lg border border-[#E4E4E7] max-h-[400px] overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-[#FAFAFA] sticky top-0">
                                <tr>
                                  {message.data.columns.map((col) => (
                                    <th
                                      key={col.id}
                                      className="px-3 py-2 text-left font-medium text-[#09090B] whitespace-nowrap"
                                    >
                                      {col.label}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {message.data.rows.map((row, rowIndex) => (
                                  <tr
                                    key={rowIndex}
                                    className="border-t border-[#E4E4E7] hover:bg-[#FAFAFA]"
                                  >
                                    {message.data!.columns.map((col) => (
                                      <td
                                        key={col.id}
                                        className="px-3 py-2 text-[#09090B]"
                                      >
                                        {row[col.id] !== null && row[col.id] !== undefined && row[col.id] !== "" 
                                          ? String(row[col.id]) 
                                          : "-"}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {message.data.rows.length >= 50 && (
                            <p className="text-xs text-[#71717B]">
                              最初の50件を表示しています
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-[#71717B]">
                          データが見つかりませんでした。
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#E4E4E7] rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-[#71717B]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">考え中...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[#E4E4E7] shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="質問を入力してください..."
              disabled={isLoading}
              className="flex-1 rounded-xl border-[#E4E4E7]"
              maxLength={500}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-[#09090B] text-white rounded-full px-4 hover:bg-[#27272A]"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
