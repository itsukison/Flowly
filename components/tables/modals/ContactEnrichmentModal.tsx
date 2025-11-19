"use client";

import { useState, useRef, useEffect } from "react";
import { X, Plus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Column {
  id: string;
  name: string;
  label: string;
  type: string;
}

interface TableRecord {
  id: string;
  name?: string | null;
  email?: string | null;
  company?: string | null;
  data: Record<string, any>;
  [key: string]: any;
}

interface ContactEnrichmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: string;
  columns: Column[];
  records: TableRecord[];
  onComplete: () => void;
}

interface EnrichedRecordDisplay {
  id: string;
  originalData: Record<string, any>;
  enrichedData: Record<string, any>;
  confidence: Record<string, number>;
  status: 'pending' | 'processing' | 'success' | 'failed';
}

export function ContactEnrichmentModal({
  open,
  onOpenChange,
  tableId,
  columns,
  records,
  onComplete,
}: ContactEnrichmentModalProps) {
  const [phase, setPhase] = useState<"config" | "enriching" | "review">("config");
  const [jobId, setJobId] = useState<string>("");
  
  // Detect company name and URL columns
  const detectSourceColumns = () => {
    // Priority order for company column detection
    // 1. Exact match for 会社名 or company_name
    // 2. Contains 会社 or company
    // 3. Fallback to name/名前 only if no company column exists
    
    let companyCol = columns.find(col => {
      const name = col.name.toLowerCase();
      const label = col.label.toLowerCase();
      return name === '会社名' || name === 'company_name' || 
             label === '会社名' || label === 'company name';
    });
    
    if (!companyCol) {
      companyCol = columns.find(col => {
        const name = col.name.toLowerCase();
        const label = col.label.toLowerCase();
        return name.includes('会社') || name.includes('company') ||
               label.includes('会社') || label.includes('company');
      });
    }
    
    if (!companyCol) {
      companyCol = columns.find(col => {
        const name = col.name.toLowerCase();
        const label = col.label.toLowerCase();
        return name === 'name' || name === '名前' ||
               label === '名前' || label === 'name';
      });
    }
    
    // URL column detection
    const urlCol = columns.find(col => {
      const name = col.name.toLowerCase();
      const label = col.label.toLowerCase();
      return name.includes('url') || name.includes('website') || 
             name.includes('domain') || name.includes('ウェブ') ||
             label.includes('url') || label.includes('website') || 
             label.includes('domain') || label.includes('ウェブ');
    });
    
    return { companyCol, urlCol };
  };
  
  const { companyCol, urlCol } = detectSourceColumns();
  
  // Check if records have company name or URL
  const hasSourceData = records.some(record => {
    const hasCompany = record.company || record.name || 
                      (companyCol && record.data?.[companyCol.name]);
    const hasUrl = urlCol && record.data?.[urlCol.name];
    return hasCompany || hasUrl;
  });
  
  // Config state
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [newColumns, setNewColumns] = useState<string[]>([]);
  const [newColumnInput, setNewColumnInput] = useState<string>("");
  
  // Enrichment state
  const [enrichedRecords, setEnrichedRecords] = useState<EnrichedRecordDisplay[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressLogRef = useRef<HTMLDivElement>(null);

  // Auto-scroll progress log
  useEffect(() => {
    if (progressLogRef.current) {
      progressLogRef.current.scrollTop = progressLogRef.current.scrollHeight;
    }
  }, [progressMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleToggleColumn = (columnName: string) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(columnName)) {
      newSelected.delete(columnName);
    } else {
      newSelected.add(columnName);
    }
    setSelectedColumns(newSelected);
  };

  const handleAddNewColumn = () => {
    if (newColumnInput.trim() && !newColumns.includes(newColumnInput.trim())) {
      setNewColumns([...newColumns, newColumnInput.trim()]);
      setNewColumnInput("");
    }
  };

  const handleRemoveNewColumn = (index: number) => {
    setNewColumns(newColumns.filter((_, i) => i !== index));
  };

  const handleStartEnrichment = async () => {
    const allColumns = [...Array.from(selectedColumns), ...newColumns];
    
    if (allColumns.length === 0) {
      alert("少なくとも1つの列を選択するか追加してください");
      return;
    }
    
    if (!hasSourceData) {
      alert("エンリッチメントには会社名またはURLが必要です。\n選択されたレコードに会社名またはURLが含まれていることを確認してください。");
      return;
    }

    setPhase("enriching");
    setIsProcessing(true);
    setProgress({ current: 0, total: records.length });
    setProgressMessages([]);

    // Initialize empty enriched records
    const initialRecords: EnrichedRecordDisplay[] = records.map(record => ({
      id: record.id,
      originalData: {
        name: record.name,
        company: record.company,
        email: record.email,
        ...record.data,
      },
      enrichedData: Object.fromEntries(allColumns.map(col => [col, null])),
      confidence: {},
      status: 'pending',
    }));
    setEnrichedRecords(initialRecords);
    setSelectedRows(new Set(records.map(r => r.id)));

    try {
      // Start enrichment
      const response = await fetch('/api/enrichment/enrich-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordIds: records.map(r => r.id),
          targetColumns: allColumns,
          newColumns: newColumns.map(name => ({
            name,
            label: name,
            type: 'text',
          })),
          tableId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start enrichment');
      }

      const { jobId: returnedJobId } = await response.json();
      setJobId(returnedJobId);

      // Poll for progress
      pollIntervalRef.current = setInterval(async () => {
        try {
          const progressRes = await fetch(`/api/enrichment/enrich-progress/${returnedJobId}`);
          if (!progressRes.ok) throw new Error('Failed to fetch progress');

          const progressData = await progressRes.json();

          // Update progress
          setProgress({
            current: progressData.completedRecords,
            total: progressData.totalRecords,
          });

          // Add progress message
          if (progressData.message) {
            setProgressMessages(prev => {
              const newMessages = [...prev, progressData.message];
              return newMessages.slice(-20); // Keep last 20
            });
          }

          // Update enriched records with results
          if (progressData.results && progressData.results.length > 0) {
            setEnrichedRecords(prevRecords => {
              const updated = [...prevRecords];
              
              progressData.results.forEach((result: any) => {
                const index = updated.findIndex(r => r.id === result.recordId);
                if (index !== -1) {
                  const enrichedData: Record<string, any> = {};
                  const confidence: Record<string, number> = {};
                  
                  result.fields.forEach((field: any) => {
                    enrichedData[field.name] = field.value;
                    confidence[field.name] = field.confidence;
                  });
                  
                  updated[index] = {
                    ...updated[index],
                    enrichedData,
                    confidence,
                    status: result.success ? 'success' : 'failed',
                  };
                }
              });
              
              return updated;
            });
          }

          // Check if complete
          if (progressData.status === 'completed' || progressData.status === 'failed') {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            setIsProcessing(false);
            setPhase('review');
          }

        } catch (error) {
          console.error('Progress polling error:', error);
        }
      }, 1500); // Poll every 1.5 seconds

    } catch (error) {
      console.error('Enrichment error:', error);
      alert('エンリッチメントの開始に失敗しました');
      setPhase('config');
      setIsProcessing(false);
    }
  };

  const handleToggleRow = (recordId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId);
    } else {
      newSelected.add(recordId);
    }
    setSelectedRows(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedRows.size === enrichedRecords.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(enrichedRecords.map(r => r.id)));
    }
  };

  const handleSaveChanges = async () => {
    if (selectedRows.size === 0) {
      alert("少なくとも1件のレコードを選択してください");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(`/api/enrichment/update-records/${jobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedRecordIds: Array.from(selectedRows),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update records');
      }

      const result = await response.json();
      console.log('Update result:', result);

      // Close and refresh
      onComplete();
      onOpenChange(false);

    } catch (error) {
      console.error('Save error:', error);
      alert('変更の保存に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessing && phase === 'enriching') {
      const confirm = window.confirm(
        'エンリッチメント処理中です。本当に閉じますか？'
      );
      if (!confirm) return;
    }

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    onOpenChange(false);
  };

  const allColumns = [...Array.from(selectedColumns), ...newColumns];
  const successCount = enrichedRecords.filter(r => r.status === 'success').length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="!max-w-[90vw] w-[90vw] h-[85vh] p-0 gap-0 flex flex-col overflow-hidden"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E4E4E7] shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-[#09090B]">
              {phase === "config" && "連絡先エンリッチメント"}
              {phase === "enriching" && "エンリッチメント中"}
              {phase === "review" && "結果の確認"}
            </h2>
            <Badge
              variant="secondary"
              className="px-2 py-0.5 text-[10px] bg-[#F4F4F5] text-[#71717B] rounded-full"
            >
              {records.length} 件
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={isProcessing && phase === 'enriching'}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        {phase === "config" && (
          <div className="flex-1 overflow-y-auto px-8 py-8">
            <div className="max-w-4xl mx-auto flex flex-col justify-center min-h-full space-y-8">
              {/* Info Banner */}
              <div className={cn(
                "p-5 rounded-xl border-2",
                hasSourceData 
                  ? "bg-[#FAFAFA] border-[#E4E4E7]" 
                  : "bg-amber-50 border-amber-300"
              )}>
                <div className="flex items-start gap-3">
                  {hasSourceData ? (
                    <CheckCircle2 className="w-5 h-5 text-[#09090B] mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-medium mb-1",
                      hasSourceData ? "text-[#09090B]" : "text-amber-900"
                    )}>
                      {hasSourceData 
                        ? "エンリッチメント可能" 
                        : "会社名またはURLが必要です"}
                    </p>
                    <p className={cn(
                      "text-sm leading-relaxed",
                      hasSourceData ? "text-[#52525B]" : "text-amber-700"
                    )}>
                      {hasSourceData ? (
                        <>
                          選択されたレコードには会社名またはURLが含まれています。
                          {companyCol && <span className="font-medium"> 会社名列: {companyCol.label}</span>}
                          {companyCol && urlCol && <span> • </span>}
                          {urlCol && <span className="font-medium">URL列: {urlCol.label}</span>}
                        </>
                      ) : (
                        "エンリッチメントを実行するには、レコードに会社名またはURLが必要です。これらの情報を基に、メールアドレス、電話番号、住所などの連絡先情報を取得します。"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Select existing columns */}
              <div className="space-y-4">
                <Label className="text-base font-semibold text-[#09090B]">
                  エンリッチする列を選択
                </Label>
                <div className="border border-[#E4E4E7] rounded-xl p-5 grid grid-cols-2 gap-x-6 gap-y-3 max-h-[280px] overflow-y-auto bg-white">
                  {columns.map((col) => (
                    <div key={col.id} className="flex items-center gap-3">
                      <Checkbox
                        id={col.id}
                        checked={selectedColumns.has(col.name)}
                        onCheckedChange={() => handleToggleColumn(col.name)}
                      />
                      <Label
                        htmlFor={col.id}
                        className="text-sm cursor-pointer flex-1 leading-relaxed"
                      >
                        {col.label || col.name}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[#71717B]">
                  {selectedColumns.size}個の列が選択されています
                </p>
              </div>

              {/* Add new columns */}
              <div className="space-y-4">
                <Label className="text-base font-semibold text-[#09090B]">
                  新しい列を追加（任意）
                </Label>
                <div className="flex gap-3">
                  <Input
                    value={newColumnInput}
                    onChange={(e) => setNewColumnInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        handleAddNewColumn();
                      }
                    }}
                    placeholder="列名を入力（例：担当者、住所、電話番号）"
                    className="flex-1 h-11"
                  />
                  <Button
                    onClick={handleAddNewColumn}
                    variant="outline"
                    size="icon"
                    disabled={!newColumnInput.trim()}
                    className="h-11 w-11"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                {newColumns.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newColumns.map((col, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="px-4 py-2 flex items-center gap-2 text-sm"
                      >
                        {col}
                        <button
                          onClick={() => handleRemoveNewColumn(index)}
                          className="ml-1 hover:text-[#09090B]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Start button */}
              <div className="pt-6">
                <Button
                  onClick={handleStartEnrichment}
                  disabled={allColumns.length === 0 || !hasSourceData}
                  className="w-full bg-[#09090B] text-white rounded-full py-7 text-base font-medium hover:bg-[#27272A] disabled:opacity-50"
                >
                  {!hasSourceData 
                    ? "会社名またはURLが必要です" 
                    : "エンリッチメント開始"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {(phase === "enriching" || phase === "review") && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Progress header */}
            {phase === "enriching" && (
              <div className="px-6 py-3 border-b border-[#E4E4E7] bg-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-[#09090B]" />
                    <span className="text-sm font-medium text-[#09090B]">
                      {progress.current} / {progress.total} 件処理完了
                    </span>
                  </div>
                </div>
                <Progress
                  value={(progress.current / progress.total) * 100}
                  className="h-1"
                />
              </div>
            )}

            {/* Table view */}
            <div className="flex-1 overflow-auto bg-white">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-[#FAFAFA] sticky top-0 z-10 border-b border-[#E4E4E7]">
                  <tr>
                    <th className="w-12 px-4 py-3 text-left border-r border-[#E4E4E7]">
                      <Checkbox
                        checked={selectedRows.size === enrichedRecords.length && enrichedRecords.length > 0}
                        onCheckedChange={handleToggleAll}
                      />
                    </th>
                    <th className="w-16 px-4 py-3 text-left font-medium text-[#71717B] border-r border-[#E4E4E7]">
                      #
                    </th>
                    {/* Company name column (left-most) */}
                    {companyCol && (
                      <th className="px-4 py-3 text-left font-medium text-[#09090B] border-r border-[#E4E4E7] whitespace-nowrap bg-[#F4F4F5]">
                        {companyCol.label}
                      </th>
                    )}
                    {/* URL column (second from left) */}
                    {urlCol && (
                      <th className="px-4 py-3 text-left font-medium text-[#09090B] border-r border-[#E4E4E7] whitespace-nowrap bg-[#F4F4F5]">
                        {urlCol.label}
                      </th>
                    )}
                    {/* Enriched columns */}
                    {allColumns.map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left font-medium text-[#71717B] border-r border-[#E4E4E7] whitespace-nowrap"
                        style={{ width: '200px', minWidth: '200px' }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {enrichedRecords.map((record, index) => (
                    <tr
                      key={record.id}
                      className={cn(
                        "border-b border-[#E4E4E7] hover:bg-[#FAFAFA] transition-colors",
                        record.status === 'success' && selectedRows.has(record.id) && "bg-[#FAFAFA]",
                        !selectedRows.has(record.id) && "opacity-50"
                      )}
                    >
                      <td className="w-12 px-4 py-3 border-r border-[#E4E4E7]">
                        <Checkbox
                          checked={selectedRows.has(record.id)}
                          onCheckedChange={() => handleToggleRow(record.id)}
                        />
                      </td>
                      <td className="w-16 px-4 py-3 text-[#71717B] font-mono text-xs border-r border-[#E4E4E7]">
                        {index + 1}
                      </td>
                      {/* Company name cell */}
                      {companyCol && (
                        <td className="px-4 py-3 text-[#09090B] border-r border-[#E4E4E7] bg-[#FAFAFA] font-medium">
                          <div className="truncate">
                            {record.originalData.company || 
                             record.originalData.name || 
                             record.originalData[companyCol.name] || 
                             '—'}
                          </div>
                        </td>
                      )}
                      {/* URL cell */}
                      {urlCol && (
                        <td className="px-4 py-3 text-[#09090B] border-r border-[#E4E4E7] bg-[#FAFAFA]">
                          <div className="truncate text-xs">
                            {record.originalData[urlCol.name] || '—'}
                          </div>
                        </td>
                      )}
                      {/* Enriched data cells */}
                      {allColumns.map((col) => (
                        <td
                          key={col}
                          className={cn(
                            "px-4 py-3 border-r border-[#E4E4E7]",
                            record.enrichedData[col] ? "text-[#09090B]" : "text-[#A1A1AA] italic"
                          )}
                          style={{ width: '200px', minWidth: '200px' }}
                        >
                          <div className="truncate">
                            {record.enrichedData[col] ? (
                              <span className="animate-in fade-in duration-500">
                                {String(record.enrichedData[col])}
                              </span>
                            ) : record.status === 'processing' ? (
                              <span className="flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span className="text-xs">取得中...</span>
                              </span>
                            ) : record.status === 'pending' ? (
                              <span className="text-xs">未取得</span>
                            ) : (
                              <span className="text-xs">見つかりません</span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action buttons */}
            {phase === "review" && (
              <div className="px-6 py-4 border-t border-[#E4E4E7] bg-[#FAFAFA]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-[#09090B]">
                      <CheckCircle2 className="w-5 h-5 text-[#09090B]" />
                      <span className="font-medium">
                        エンリッチメント完了！
                      </span>
                    </div>
                    <div className="text-sm text-[#71717B]">
                      {successCount}/{enrichedRecords.length} 件成功 • {selectedRows.size} 件選択中
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleClose}
                      variant="outline"
                      className="rounded-full px-6"
                      disabled={isProcessing}
                    >
                      キャンセル
                    </Button>
                    <Button
                      onClick={handleSaveChanges}
                      className="bg-[#09090B] text-white rounded-full px-6 hover:bg-[#27272A]"
                      disabled={isProcessing || selectedRows.size === 0}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          保存中...
                        </>
                      ) : (
                        `変更を保存 (${selectedRows.size}件)`
                      )}
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
