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
  const [phase, setPhase] = useState<"form" | "generating" | "preview" | "inserting" | "complete">("form");
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
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  const [currentStage, setCurrentStage] = useState<'pending' | 'knowledge_extraction' | 'enrichment' | 'completed'>('pending');
  const [previousStage, setPreviousStage] = useState<string>('pending');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [generationProgress, setGenerationProgress] =
    useState<GenerationProgress>({
      total: 0,
      completed: 0,
      status: "idle",
      error: null,
    });
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const progressLogRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to progress log
  useEffect(() => {
    if (progressLogRef.current) {
      progressLogRef.current.scrollTop = progressLogRef.current.scrollHeight;
    }
  }, [progressMessages]);

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
    setProgressMessages([]);
    setCurrentStage('pending');
    setPreviousStage('pending');

    // Initialize empty records immediately with all columns
    const emptyRecords = Array.from({ length: rowCount }, (_, i) => ({
      index: i,
      data: Object.fromEntries(allColumns.map(col => [col, null])),
      status: 'pending'
    }));
    setLiveRecords(emptyRecords);
    
    // Select all rows by default
    setSelectedRows(new Set(Array.from({ length: rowCount }, (_, i) => i)));

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

          // Update progress messages
          if (progressData.message) {
            setProgressMessages(prev => {
              const newMessages = [...prev, progressData.message];
              return newMessages.slice(-20); // Keep last 20 messages
            });
          }

          // Update stage and detect stage changes
          const newStage = progressData.stage || 'pending';
          const stageChanged = newStage !== previousStage;
          
          if (stageChanged) {
            setPreviousStage(newStage);
            setCurrentStage(newStage);
          }

          const currentCompleted = progressData.completedRecords || 0;
          const previousCompleted = generationProgress.completed;

          setGenerationProgress({
            total: progressData.totalRecords || rowCount,
            completed: currentCompleted,
            status:
              progressData.status === "completed"
                ? "completed"
                : progressData.status === "failed"
                  ? "error"
                  : "processing",
            error: progressData.errorMessage || null,
          });

          // Load live records when:
          // 1. Stage changes to 'enrichment' (Phase 1 complete, show initial data)
          // 2. Completed count increases (new enriched data available)
          // 3. First load (no records yet)
          const shouldFetchPreview =
            (stageChanged && newStage === 'enrichment') ||
            currentCompleted > previousCompleted ||
            liveRecords.length === 0;

          if (shouldFetchPreview) {
            await loadLiveRecords(returnedJobId);
          }

          if (
            progressData.status === "completed" ||
            progressData.status === "failed"
          ) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            // Final fetch to ensure we have everything
            await loadLiveRecords(returnedJobId);
            
            // Move to preview phase if completed successfully
            if (progressData.status === "completed") {
              setPhase("preview");
            }
          }
        } catch (error) {
          console.error("Progress polling error:", error);
        }
      }, 1000); // Poll every 1.0 seconds for more responsive updates
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
        // Merge new data with existing records
        setLiveRecords(prevRecords => {
          const updatedRecords = [...prevRecords];
          data.records.forEach((newRecord: any) => {
            const index = newRecord.index;
            if (index >= 0 && index < updatedRecords.length) {
              // Merge data, keeping existing values if new ones are null
              updatedRecords[index] = {
                ...updatedRecords[index],
                data: {
                  ...updatedRecords[index].data,
                  ...Object.fromEntries(
                    Object.entries(newRecord.data).filter(([_, v]) => v !== null)
                  )
                },
                status: newRecord.status || 'success'
              };
            }
          });
          return updatedRecords;
        });
      }
    } catch (error) {
      // Silently fail, we'll retry on next poll
      console.error("Error loading live records:", error);
    }
  };

  const handleToggleRow = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedRows.size === liveRecords.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(liveRecords.map((_, i) => i)));
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
    setSelectedRows(new Set());
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

  const handleConfirmAndInsert = async () => {
    if (selectedRows.size === 0) {
      alert("少なくとも1件のレコードを選択してください");
      return;
    }

    setPhase("inserting");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/enrichment/insert/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tableId,
          selectedIndices: Array.from(selectedRows)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "データの挿入に失敗しました");
      }

      const result = await response.json();
      console.log("Insertion result:", result);

      setPhase("complete");
      setIsLoading(false);

      // Show success message for 2 seconds, then close and reload
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Insertion error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "データの挿入中にエラーが発生しました"
      );
      setPhase("preview"); // Go back to preview
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // If insertion completed successfully, refresh the page to show new records
    if (phase === "complete") {
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
              {phase === "form" && "AIデータ生成"}
              {phase === "generating" && "データ生成中"}
              {phase === "preview" && "生成結果の確認"}
              {phase === "inserting" && "データを追加中"}
              {phase === "complete" && "完了"}
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
              <div className="grid grid-cols-1 md:grid-cols-12 gap-20 h-full mt-8">
                {/* Left Column: Settings */}
                <div className="md:col-span-5 space-y-9 flex flex-col h-full">
                  {/* Row Count */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#09090B]">
                      生成する行数
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min="1"
                        max="1000"
                        value={rowCount}
                        onChange={(e) => setRowCount(parseInt(e.target.value) || 0)}
                        className="w-32"
                        placeholder="10"
                      />
                      <span className="text-xs text-[#71717B]">
                        (最大 1000行)
                      </span>
                    </div>
                  </div>

                  {/* Column Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-[#09090B]">
                      対象の列を選択
                    </Label>
                    <div className="border border-[#E4E4E7] rounded-lg p-4 grid grid-cols-2 gap-x-4 gap-y-2 max-h-[220px] overflow-y-auto">
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
                          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
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
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
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
                </div>

                {/* Right Column: Description */}
                <div className="md:col-span-7 flex flex-col h-full space-y-2">
                  <Label className="text-sm font-medium text-[#09090B]">
                    データの説明
                  </Label>
                  <div className="flex-1 relative min-h-[280px]">
                    <Textarea
                      value={dataDescription}
                      onChange={(e) => setDataDescription(e.target.value)}
                      placeholder="例：日本のEC企業で、売上が10億円以上の会社。
特にアパレルや雑貨を扱っている企業を中心に生成してください。
従業員数は正確でなくても良いですが、規模感は合わせてください。"
                      className="w-full h-full resize-none p-4 text-base leading-relaxed"
                      maxLength={1000}
                    />
                    <div className="absolute bottom-4 right-4 text-xs text-[#71717B] bg-white/80 px-2 py-1 rounded">
                      {dataDescription.length}/1000
                    </div>
                  </div>
                  <p className="text-xs text-[#71717B]">
                    具体的であるほど、AIはより正確なデータを生成します。業界、規模、地域、特徴などを詳しく記述してください。
                  </p>
                </div>
              </div>

              {/* Removed original Data Description section as it's now in the grid */}

              {/* Action Button */}
              <div className="pt-4 pb-2">
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
            <div className="px-6 py-3 border-b border-[#E4E4E7] bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {generationProgress.status === "processing" && (
                      <Loader2 className="w-4 h-4 animate-spin text-[#09090B]" />
                    )}
                    <span className="text-sm font-medium text-[#09090B]">
                      {generationProgress.completed} / {generationProgress.total} 件生成完了
                    </span>
                  </div>
                  {/* Status Ticker */}
                  {progressMessages.length > 0 && (
                    <div className="text-xs text-[#71717B] flex items-center gap-2 border-l border-[#E4E4E7] pl-3 animate-in fade-in">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        currentStage === 'pending' && "bg-[#A1A1AA]",
                        currentStage === 'knowledge_extraction' && "bg-[#71717B]",
                        currentStage === 'enrichment' && "bg-[#52525B]",
                        currentStage === 'completed' && "bg-[#27272A]"
                      )} />
                      {progressMessages[progressMessages.length - 1]}
                    </div>
                  )}
                </div>
              </div>
              <Progress
                value={
                  (generationProgress.completed / generationProgress.total) *
                  100
                }
                className="h-1"
              />
            </div>

            {/* Shadcn Table View with Checkboxes */}
            <div className="flex-1 flex flex-col min-h-0 bg-white">
              <div className="flex-1 overflow-auto" ref={tableContainerRef}>
                {liveRecords.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-[#71717B]">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#E4E4E7]" />
                      <p className="text-sm">準備中...</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-[#FAFAFA] sticky top-0 z-10 border-b border-[#E4E4E7]">
                          <tr>
                            <th className="w-12 px-4 py-3 text-left border-r border-[#E4E4E7]">
                              <Checkbox
                                checked={selectedRows.size === liveRecords.length && liveRecords.length > 0}
                                onCheckedChange={handleToggleAll}
                                aria-label="Select all rows"
                              />
                            </th>
                            <th className="w-16 px-4 py-3 text-left font-medium text-[#71717B] border-r border-[#E4E4E7]">
                              #
                            </th>
                            {liveRecords[0] &&
                              Object.keys(liveRecords[0].data).map((key) => (
                                <th
                                  key={key}
                                  className="px-4 py-3 text-left font-medium text-[#71717B] border-r border-[#E4E4E7] whitespace-nowrap"
                                  style={{ width: '200px', minWidth: '200px', maxWidth: '200px' }}
                                >
                                  {key}
                                </th>
                              ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {liveRecords.map((record, index) => (
                            <tr
                              key={record.index || index}
                              className={cn(
                                "border-b border-[#E4E4E7] hover:bg-[#FAFAFA] transition-colors",
                                record.status === 'success' && selectedRows.has(index) && "bg-[#FAFAFA]",
                                !selectedRows.has(index) && "opacity-50"
                              )}
                            >
                              <td className="w-12 px-4 py-3 border-r border-[#E4E4E7]">
                                <Checkbox
                                  checked={selectedRows.has(index)}
                                  onCheckedChange={() => handleToggleRow(index)}
                                  aria-label={`Select row ${index + 1}`}
                                />
                              </td>
                              <td className="w-16 px-4 py-3 text-[#71717B] font-mono text-xs border-r border-[#E4E4E7]">
                                {index + 1}
                              </td>
                              {Object.entries(record.data).map(([key, value]) => (
                                <td
                                  key={key}
                                  className={cn(
                                    "px-4 py-3 text-[#09090B] border-r border-[#E4E4E7]",
                                    value === null && "text-[#A1A1AA] italic"
                                  )}
                                  style={{ width: '200px', minWidth: '200px', maxWidth: '200px' }}
                                >
                                  <div className="truncate" title={typeof value === 'string' ? value : undefined}>
                                    {value !== null && value !== undefined ? (
                                      <span className="animate-in fade-in duration-500">
                                        {String(value)}
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1">
                                        {currentStage === 'knowledge_extraction' && index === 0 ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : currentStage === 'enrichment' && record.status === 'pending' ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <span className="text-xs">-</span>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {phase === "preview" && (
              <div className="px-6 py-4 border-t border-[#E4E4E7] bg-[#FAFAFA]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-[#09090B]">
                      <CheckCircle2 className="w-5 h-5 text-[#09090B]" />
                      <span className="font-medium">
                        生成完了！
                      </span>
                    </div>
                    <div className="text-sm text-[#71717B]">
                      {selectedRows.size} / {liveRecords.length} 件選択中
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleRestart}
                      variant="outline"
                      className="rounded-full px-6"
                      disabled={isLoading}
                    >
                      やり直す
                    </Button>
                    <Button
                      onClick={handleConfirmAndInsert}
                      className="bg-[#09090B] text-white rounded-full px-6 hover:bg-[#27272A]"
                      disabled={isLoading || selectedRows.size === 0}
                    >
                      テーブルに追加 ({selectedRows.size}件)
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {phase === "inserting" && (
              <div className="px-6 py-4 border-t border-[#E4E4E7] bg-[#FAFAFA]">
                <div className="flex items-center gap-3 text-sm text-[#09090B]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">
                    データをテーブルに追加しています...
                  </span>
                </div>
              </div>
            )}

            {phase === "complete" && (
              <div className="px-6 py-4 border-t border-[#E4E4E7] bg-[#FAFAFA]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[#09090B]">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">
                      {selectedRows.size}件のレコードをテーブルに追加しました！
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
              <div className="px-6 py-4 border-t border-[#E4E4E7] bg-[#FAFAFA]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[#09090B]">
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
