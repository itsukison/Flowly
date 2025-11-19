/**
 * @deprecated This component is deprecated and will be removed in a future version.
 * 
 * Use ContactEnrichmentModal instead for better performance and UX.
 * 
 * The new system uses Gemini 3 Pro with Firecrawl fallback:
 * - 57-81% cost reduction
 * - 2-3x faster enrichment
 * - Real-time progress updates
 * - Uses ALL row data for smarter enrichment
 * - Flexible column selection
 * 
 * Migration: Replace EnrichmentModal with ContactEnrichmentModal
 * See: .agent/tasks/CONTACT_ENRICHMENT_GEMINI3_REFACTOR_PLAN.md
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";

interface Column {
  id: string;
  name: string;
  label: string;
  type: string;
}

type TableRecord = {
  id: string;
  name?: string | null;
  email?: string | null;
  company?: string | null;
  data: Record<string, any>;
  [key: string]: any;
};

interface EnrichmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: Column[];
  records: TableRecord[];
  onComplete: () => void;
  onStatusChange?: (status: 'idle' | 'processing' | 'done') => void;
}

interface EnrichmentResult {
  recordId: string;
  success: boolean;
  data?: {
    email: string | null;
    phone: string | null;
    address: string | null;
    representative: string | null;
    confidence: number;
    source: string;
    tokushoho_url: string;
  };
  error?: string;
}

interface EnrichedRecord extends TableRecord {
  enrichmentData?: {
    email: string | null;
    phone: string | null;
    representative: string | null;
    confidence: number;
  };
  enrichmentStatus: 'success' | 'failed';
}

export function EnrichmentModal({
  open,
  onOpenChange,
  columns,
  records,
  onComplete,
  onStatusChange,
}: EnrichmentModalProps) {
  const [step, setStep] = useState<"config" | "processing" | "results">("config");
  const [sourceColumn, setSourceColumn] = useState<string>("");
  const [targetFields, setTargetFields] = useState<string[]>(["email", "phone", "representative"]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<EnrichmentResult[]>([]);
  const [enrichedRecords, setEnrichedRecords] = useState<EnrichedRecord[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Find potential source columns (company name, URL, website, domain)
  const sourceColumns = useMemo(() => {
    const potentialColumns = columns.filter(col => {
      const name = col.name.toLowerCase();
      const label = col.label.toLowerCase();
      return (
        name.includes('company') || name.includes('会社') ||
        name.includes('url') || name.includes('website') || name.includes('domain') ||
        label.includes('company') || label.includes('会社') ||
        label.includes('url') || label.includes('website') || label.includes('domain')
      );
    });

    // Also check direct properties
    const directProps = ['name', 'company'].filter(prop =>
      records.some(r => r[prop])
    );

    const directColumns = directProps.map(prop => ({
      id: prop,
      name: prop,
      label: prop === 'name' ? '名前' : '会社名',
      type: 'text'
    }));

    return [...directColumns, ...potentialColumns];
  }, [columns, records]);

  const toggleTargetField = useCallback((field: string) => {
    setTargetFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  }, []);

  const getRecordValue = useCallback((record: TableRecord, columnName: string): string => {
    if (record[columnName] !== undefined && record[columnName] !== null) {
      return String(record[columnName]);
    }
    const data = record.data || {};
    if (data[columnName] !== undefined && data[columnName] !== null) {
      return String(data[columnName]);
    }
    return '';
  }, []);

  const startEnrichment = async () => {
    if (!sourceColumn) {
      alert('ソース列を選択してください');
      return;
    }

    if (targetFields.length === 0) {
      alert('少なくとも1つのターゲットフィールドを選択してください');
      return;
    }

    setIsProcessing(true);
    setStep('processing');
    setProgress({ current: 0, total: records.length });
    onStatusChange?.('processing');

    try {
      const response = await fetch('/api/enrich/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordIds: records.map(r => r.id),
          sourceColumn,
          targetFields
        })
      });

      if (!response.ok) {
        throw new Error('Enrichment failed');
      }

      const data = await response.json();
      setResults(data.results || []);
      
      // Merge results with original records
      const enriched: EnrichedRecord[] = records.map((record, index) => {
        const result = data.results[index];
        return {
          ...record,
          enrichmentData: result.success ? {
            email: result.data?.email || null,
            phone: result.data?.phone || null,
            representative: result.data?.representative || null,
            confidence: result.data?.confidence || 0,
          } : undefined,
          enrichmentStatus: result.success ? 'success' : 'failed',
        };
      });
      
      setEnrichedRecords(enriched);
      setProgress({ current: records.length, total: records.length });
      setStep('results');
      onStatusChange?.('done');
    } catch (error) {
      console.error('Enrichment error:', error);
      alert('エンリッチメントに失敗しました');
      setStep('config');
      onStatusChange?.('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    // Only reset if not processing
    if (!isProcessing) {
      setStep('config');
      setSourceColumn('');
      setTargetFields(['email', 'phone', 'representative']);
      setResults([]);
      setProgress({ current: 0, total: 0 });
      onStatusChange?.('idle');
    }
    onOpenChange(false);
  };

  const handleComplete = () => {
    onComplete();
    setStep('config');
    setSourceColumn('');
    setTargetFields(['email', 'phone', 'representative']);
    setResults([]);
    setProgress({ current: 0, total: 0 });
    onStatusChange?.('idle');
    onOpenChange(false);
  };

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !isProcessing) {
        handleClose();
      }
    }}>
      <DialogContent className="!max-w-[1200px] w-[1200px] max-h-[90vh] overflow-hidden flex flex-col bg-white border border-[#E4E4E7] rounded-2xl shadow-[12px_12px_20px_-2px_rgba(0,0,0,0.09),6px_6px_10px_-2px_rgba(0,0,0,0.32)]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-medium text-[#09090B]">
            {step === 'config' && '連絡先情報のエンリッチメント'}
            {step === 'processing' && '情報を検索中'}
            {step === 'results' && 'エンリッチメント結果'}
          </DialogTitle>
          <p className="text-xs text-[#71717B]">
            {step === 'config' && `${records.length} 件のレコードをエンリッチ`}
            {step === 'processing' && `${progress.current} / ${progress.total} 件処理済み`}
            {step === 'results' && `成功: ${successCount}件 / 失敗: ${failureCount}件`}
          </p>
        </DialogHeader>

        {step === 'config' && (
          <div className="space-y-6 overflow-y-auto flex-1 pr-2">
            {/* Info Banner - Redesigned */}
            <div className="p-4 bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl">
              <p className="text-sm text-[#09090B] leading-relaxed">
                <span className="font-medium">推奨:</span> 会社のURLまたはウェブサイトの列を使用すると、より正確な結果が得られます。
                会社名のみの場合、検索結果の精度が低下する可能性があります。
              </p>
            </div>

            {/* Source Column Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium text-[#09090B]">
                ソース列を選択
              </Label>
              <p className="text-xs text-[#71717B]">
                会社名またはURLを含む列を選択してください
              </p>
              <RadioGroup value={sourceColumn} onValueChange={setSourceColumn}>
                {sourceColumns.length === 0 ? (
                  <div className="text-center py-6 text-sm text-[#A1A1AA]">
                    利用可能なソース列がありません
                  </div>
                ) : (
                  sourceColumns.map(column => (
                    <label
                      key={column.name}
                      htmlFor={`source-${column.name}`}
                      className={`flex items-center space-x-3 p-3 border rounded-xl bg-white transition-all cursor-pointer ${
                        sourceColumn === column.name
                          ? 'border-[#09090B]'
                          : 'border-[#E4E4E7] hover:border-[#71717B]'
                      }`}
                    >
                      <RadioGroupItem value={column.name} id={`source-${column.name}`} />
                      <span className="text-sm text-[#09090B]">{column.label}</span>
                    </label>
                  ))
                )}
              </RadioGroup>
            </div>

            {/* Target Fields Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium text-[#09090B]">
                取得する情報
              </Label>
              <div className="grid grid-cols-1 gap-3 border border-[#E4E4E7] rounded-xl p-4 bg-white">
                <label
                  htmlFor="field-email"
                  className="flex items-center space-x-3 cursor-pointer group"
                >
                  <Checkbox
                    id="field-email"
                    checked={targetFields.includes('email')}
                    onCheckedChange={() => toggleTargetField('email')}
                  />
                  <span className="text-sm text-[#09090B] group-hover:text-[#27272A] transition-colors">
                    メールアドレス
                  </span>
                </label>
                <label
                  htmlFor="field-phone"
                  className="flex items-center space-x-3 cursor-pointer group"
                >
                  <Checkbox
                    id="field-phone"
                    checked={targetFields.includes('phone')}
                    onCheckedChange={() => toggleTargetField('phone')}
                  />
                  <span className="text-sm text-[#09090B] group-hover:text-[#27272A] transition-colors">
                    電話番号
                  </span>
                </label>
                <label
                  htmlFor="field-representative"
                  className="flex items-center space-x-3 cursor-pointer group"
                >
                  <Checkbox
                    id="field-representative"
                    checked={targetFields.includes('representative')}
                    onCheckedChange={() => toggleTargetField('representative')}
                  />
                  <span className="text-sm text-[#09090B] group-hover:text-[#27272A] transition-colors">
                    担当者・代表者名
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-12">
            <div className="w-full max-w-md space-y-4">
              <Progress value={(progress.current / progress.total) * 100} className="h-3" />
              <div className="text-center">
                <div className="text-lg font-medium text-[#09090B]">
                  {progress.current} / {progress.total} 件処理済み
                </div>
                <div className="text-sm text-[#71717B] mt-2">
                  情報を検索しています...
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="mt-4"
            >
              バックグラウンドで実行
            </Button>
          </div>
        )}

        {step === 'results' && (
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {/* Summary */}
            <div className="flex items-center justify-between p-4 bg-[#FAFAFA] rounded-xl border border-[#E4E4E7]">
              <div>
                <div className="text-base font-medium text-[#09090B]">
                  処理完了
                </div>
                <div className="text-xs text-[#71717B] mt-0.5">
                  成功: {successCount}件 / 失敗: {failureCount}件
                </div>
              </div>
            </div>

            {/* Table View */}
            <div className="border border-[#E4E4E7] rounded-xl overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-[#E4E4E7] bg-[#FAFAFA]">
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#71717B] uppercase tracking-wide min-w-[100px]">
                        ステータス
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#71717B] uppercase tracking-wide min-w-[150px]">
                        {sourceColumns.find(c => c.name === sourceColumn)?.label || 'ソース'}
                      </th>
                      {targetFields.includes('email') && (
                        <th className="text-left px-4 py-3 text-xs font-medium text-[#71717B] uppercase tracking-wide min-w-[200px]">
                          メールアドレス
                        </th>
                      )}
                      {targetFields.includes('phone') && (
                        <th className="text-left px-4 py-3 text-xs font-medium text-[#71717B] uppercase tracking-wide min-w-[150px]">
                          電話番号
                        </th>
                      )}
                      {targetFields.includes('representative') && (
                        <th className="text-left px-4 py-3 text-xs font-medium text-[#71717B] uppercase tracking-wide min-w-[150px]">
                          担当者
                        </th>
                      )}
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#71717B] uppercase tracking-wide min-w-[100px]">
                        信頼度
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedRecords.map((record, index) => (
                      <tr 
                        key={record.id}
                        className="border-b border-[#E4E4E7] last:border-b-0 hover:bg-[#FAFAFA] transition-colors"
                      >
                        <td className="px-4 py-3">
                          {record.enrichmentStatus === 'success' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 border border-green-200 text-xs font-medium text-green-700">
                              成功
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                              失敗
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#09090B]">
                          {getRecordValue(record, sourceColumn) || <span className="text-[#A1A1AA]">—</span>}
                        </td>
                        {targetFields.includes('email') && (
                          <td className="px-4 py-3 text-sm text-[#09090B]">
                            {record.enrichmentData?.email || <span className="text-[#A1A1AA]">—</span>}
                          </td>
                        )}
                        {targetFields.includes('phone') && (
                          <td className="px-4 py-3 text-sm text-[#09090B]">
                            {record.enrichmentData?.phone || <span className="text-[#A1A1AA]">—</span>}
                          </td>
                        )}
                        {targetFields.includes('representative') && (
                          <td className="px-4 py-3 text-sm text-[#09090B]">
                            {record.enrichmentData?.representative || <span className="text-[#A1A1AA]">—</span>}
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm text-[#09090B]">
                          {record.enrichmentData?.confidence ? (
                            <span className="font-medium">{record.enrichmentData.confidence}%</span>
                          ) : (
                            <span className="text-[#A1A1AA]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {step !== 'processing' && (
          <div className="flex justify-end items-center pt-6 border-t border-[#E4E4E7] gap-3">
            {step === 'config' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isProcessing}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={startEnrichment}
                  disabled={!sourceColumn || targetFields.length === 0 || isProcessing}
                >
                  エンリッチメント開始
                </Button>
              </>
            )}
            {step === 'results' && (
              <Button onClick={handleComplete}>
                完了
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
