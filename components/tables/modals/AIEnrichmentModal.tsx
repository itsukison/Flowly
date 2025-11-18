"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Loader2,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Column {
  id: string;
  name: string;
  label: string;
  type: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface EnrichmentRequirements {
  rowCount: number;
  targetColumns: string[];
  dataType: string;
  specifications?: string;
}

interface GenerationProgress {
  total: number;
  completed: number;
  status: "idle" | "processing" | "completed" | "error";
  error: string | null;
}

interface AIEnrichmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: string;
  tableName: string;
  columns: Column[];
  onEnrichmentStart: (
    sessionId: string,
    requirements: EnrichmentRequirements
  ) => void;
}

export function AIEnrichmentModal({
  open,
  onOpenChange,
  tableId,
  tableName,
  columns,
  onEnrichmentStart,
}: AIEnrichmentModalProps) {
  const [phase, setPhase] = useState<"form" | "generating">("form");
  const [jobId, setJobId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [rowCount, setRowCount] = useState<number>(10);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set()
  );
  const [newColumns, setNewColumns] = useState<string[]>([]);
  const [newColumnInput, setNewColumnInput] = useState<string>("");
  const [dataDescription, setDataDescription] = useState<string>("");

  // Real-time data state
  const [liveRecords, setLiveRecords] = useState<any[]>([]);
  const [generationProgress, setGenerationProgress] =
    useState<GenerationProgress>({
      total: 0,
      completed: 0,
      status: "idle",
      error: null,
    });
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newly added rows
  useEffect(() => {
    if (tableContainerRef.current && liveRecords.length > 0) {
      const container = tableContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [liveRecords]);

  // Cleanup poll interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleAddNewColumn = () => {
    if (newColumnInput.trim()) {
      setNewColumns([...newColumns, newColumnInput.trim()]);
      setNewColumnInput("");
    }
  };

  const handleRemoveNewColumn = (index: number) => {
    setNewColumns(newColumns.filter((_, i) => i !== index));
  };

  const handleToggleColumn = (columnName: string) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(columnName)) {
      newSelected.delete(columnName);
    } else {
      newSelected.add(columnName);
    }
    setSelectedColumns(newSelected);
  };

  const handleStartGeneration = async () => {
    // Validate form
    const allColumns = [...Array.from(selectedColumns), ...newColumns];
    if (allColumns.length === 0) {
      alert("少なくとも1つの列を選択するか追加してください");
      return;
    }
    if (!dataDescription.trim()) {
      alert("データの説明を入力してください");
      return;
    }
    if (rowCount < 1 || rowCount > 1000) {
      alert("行数は1から1000の間で指定してください");
      return;
    }

    setPhase("generating");
    setLiveRecords([]);
    setGenerationProgress({
      total: rowCount,
      completed: 0,
      status: "processing",
      error: null,
    });

    try {
      const requirements = {
        rowCount,
        targetColumns: allColumns,
        dataType: dataDescription.trim(),
        specifications: "",
      };

      const response = await fetch(
        `/api/enrichment/generate?tableId=${tableId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: `manual_${Date.now()}`,
            requirements,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "データ生成の開始に失敗しました");
      }

      const { jobId: returnedJobId } = await response.json();
      setJobId(returnedJobId);

      // Poll for progress and load records in real-time
      pollIntervalRef.current = setInterval(async () => {
        try {
          const progressRes = await fetch(
            `/api/enrichment/progress/${returnedJobId}`
          );
          if (!progressRes.ok) throw new Error("進捗の取得に失敗しました");

          const progressData = await progressRes.json();

          setGenerationProgress({
            total: progressData.totalRecords || rowCount,
            completed: progressData.completedRecords || 0,
            status:
              progressData.status === "completed"
                ? "completed"
                : progressData.status === "failed"
                ? "error"
                : "processing",
            error: progressData.errorMessage || null,
          });

          // Load live records
          await loadLiveRecords(returnedJobId);

          if (
            progressData.status === "completed" ||
            progressData.status === "failed"
          ) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        } catch (error) {
          console.error("Progress polling error:", error);
        }
      }, 2000);
    } catch (error) {
      console.error("Generation error:", error);
      setGenerationProgress((prev) => ({
        ...prev,
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "データ生成中にエラーが発生しました",
      }));
    }
  };

  const loadLiveRecords = async (jobIdToLoad: string) => {
    try {
      const response = await fetch(`/api/enrichment/preview/${jobIdToLoad}`);
      if (!response.ok) return; // Silently fail, we'll retry on next poll

      const data = await response.json();
      if (data.records && data.records.length > 0) {
        setLiveRecords(data.records);
      }
    } catch (error) {
      // Silently fail, we'll retry on next poll
      console.error("Error loading live records:", error);
    }
  };

  const handleRestart = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setPhase("form");
    setJobId("");
    setLiveRecords([]);
    setRowCount(10);
    setSelectedColumns(new Set());
    setNewColumns([]);
    setNewColumnInput("");
    setDataDescription("");
    setGenerationProgress({
      total: 0,
      completed: 0,
      status: "idle",
      error: null,
    });
  };

  const handleClose = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // If generation completed successfully, refresh the page to show new records
    if (generationProgress.status === "completed") {
      window.location.reload();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="!max-w-[90vw] w-[90vw] h-[85vh] p-0 gap-0 flex flex-col overflow-hidden"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E4E4E7] shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#09090B]" />
            <h2 className="text-base font-semibold text-[#09090B]">
              {phase === "form" ? "AIデータ生成" : "データ生成中"}
            </h2>
            <Badge
              variant="secondary"
              className="px-2 py-0.5 text-[10px] bg-[#F4F4F5] text-[#71717B] rounded-full"
            >
              Beta
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {phase === "form" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRestart}
                disabled={isLoading}
                className="text-[#71717B] hover:text-[#09090B]"
              >
                クリア
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isLoading && phase === "generating"}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        {phase === "form" ? (
          /* Form View */
          <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Row Count */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#09090B]">
                  生成する行数
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={rowCount}
                  onChange={(e) => setRowCount(parseInt(e.target.value) || 0)}
                  className="w-full"
                  placeholder="1-1000"
                />
                <p className="text-xs text-[#71717B]">
                  1から1000の間で指定してください
                </p>
              </div>

              {/* Column Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-[#09090B]">
                  対象の列を選択
                </Label>
                <div className="border border-[#E4E4E7] rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                  {columns.map((col) => (
                    <div key={col.id} className="flex items-center gap-2">
                      <Checkbox
                        id={col.id}
                        checked={selectedColumns.has(col.name)}
                        onCheckedChange={() => handleToggleColumn(col.name)}
                      />
                      <Label
                        htmlFor={col.id}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {col.label || col.name}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#71717B]">
                  {selectedColumns.size}個の列が選択されています
                </p>
              </div>

              {/* New Columns */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-[#09090B]">
                  新しい列を追加（任意）
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={newColumnInput}
                    onChange={(e) => setNewColumnInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddNewColumn();
                      }
                    }}
                    placeholder="列名を入力..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddNewColumn}
                    variant="outline"
                    size="icon"
                    disabled={!newColumnInput.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {newColumns.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newColumns.map((col, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="px-3 py-1 flex items-center gap-1"
                      >
                        {col}
                        <button
                          onClick={() => handleRemoveNewColumn(index)}
                          className="ml-1 hover:text-[#09090B]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Data Description */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#09090B]">
                  データの説明
                </Label>
                <Textarea
                  value={dataDescription}
                  onChange={(e) => setDataDescription(e.target.value)}
                  placeholder="例：日本のEC企業、小規模から中規模の会社"
                  className="min-h-[120px] resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-[#71717B]">
                  生成したいデータの種類や条件を自然言語で記述してください
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <Button
                  onClick={handleStartGeneration}
                  disabled={
                    isLoading ||
                    selectedColumns.size + newColumns.length === 0 ||
                    !dataDescription.trim()
                  }
                  className="w-full bg-[#09090B] text-white rounded-full py-6 text-base hover:bg-[#27272A]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      生成中...
                    </>
                  ) : (
                    `${rowCount}件のデータを生成`
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Real-time Table View */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Progress Header */}
            <div className="px-6 py-4 border-b border-[#E4E4E7] bg-[#FAFAFA]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-[#09090B]">
                  データ生成中...
                </h3>
                <div className="flex items-center gap-2">
                  {generationProgress.status === "processing" && (
                    <Loader2 className="w-4 h-4 animate-spin text-[#09090B]" />
                  )}
                  <span className="text-sm font-medium text-[#09090B]">
                    {generationProgress.completed} / {generationProgress.total}
                  </span>
                </div>
              </div>
              <Progress
                value={
                  (generationProgress.completed / generationProgress.total) *
                  100
                }
                className="h-2"
              />
              <p className="text-xs text-[#71717B] mt-2">
                AIがビジネスデータを生成しています。リアルタイムでテーブルに追加されます。
              </p>
            </div>

            {/* Live Table */}
            <div
              className="flex-1 overflow-auto px-6 py-4"
              ref={tableContainerRef}
            >
              {liveRecords.length === 0 ? (
                <div className="flex items-center justify-center h-full text-[#71717B]">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                    <p className="text-sm">最初のレコードを生成中...</p>
                  </div>
                </div>
              ) : (
                <div className="border border-[#E4E4E7] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7] sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-[#09090B]">
                          #
                        </th>
                        {liveRecords[0] &&
                          Object.keys(liveRecords[0].data).map((key) => (
                            <th
                              key={key}
                              className="px-4 py-3 text-left font-medium text-[#09090B]"
                            >
                              {key}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {liveRecords.map((record, index) => (
                        <tr
                          key={record.index || index}
                          className="border-b border-[#E4E4E7] hover:bg-[#FAFAFA] animate-in fade-in slide-in-from-top-2 duration-300"
                        >
                          <td className="px-4 py-3 text-[#71717B]">
                            {index + 1}
                          </td>
                          {Object.entries(record.data).map(([key, value]) => (
                            <td key={key} className="px-4 py-3 text-[#09090B]">
                              {value !== null && value !== undefined
                                ? String(value)
                                : "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {generationProgress.status === "completed" && (
              <div className="px-6 py-4 border-t border-[#E4E4E7] bg-[#FAFAFA]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[#09090B]">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-medium">
                      生成完了！ {liveRecords.length}
                      件のレコードがテーブルに追加されました。
                    </span>
                  </div>
                  <Button
                    onClick={handleClose}
                    className="bg-[#09090B] text-white rounded-full px-6 hover:bg-[#27272A]"
                  >
                    閉じる
                  </Button>
                </div>
              </div>
            )}

            {generationProgress.status === "error" && (
              <div className="px-6 py-4 border-t border-[#E4E4E7] bg-red-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span>
                      {generationProgress.error || "エラーが発生しました"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRestart}
                      variant="outline"
                      className="rounded-full px-6"
                    >
                      再試行
                    </Button>
                    <Button
                      onClick={handleClose}
                      className="bg-[#09090B] text-white rounded-full px-6 hover:bg-[#27272A]"
                    >
                      閉じる
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
