"use client";

import { useState, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Fuse from "fuse.js";

interface Column {
  id: string;
  name: string;
  label: string;
  type: string;
}

type TableRecord = {
  id: string;
  table_id?: string;
  organization_id?: string;
  name?: string | null;
  email?: string | null;
  company?: string | null;
  status?: string | null;
  data: Record<string, any>;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
};

interface DuplicateGroup {
  records: TableRecord[];
  confidence?: number;
}

interface DeduplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: Column[];
  records: TableRecord[];
  onConfirm: (recordsToDelete: string[]) => Promise<void>;
}

export function DeduplicationModal({
  open,
  onOpenChange,
  columns,
  records,
  onConfirm,
}: DeduplicationModalProps) {
  const [step, setStep] = useState<"config" | "preview">("config");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [matchType, setMatchType] = useState<"exact" | "fuzzy">("exact");
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedToDelete, setSelectedToDelete] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter out system columns and only show user-defined columns
  const availableColumns = useMemo(() => {
    return columns.filter(col => 
      !['id', 'table_id', 'organization_id', 'created_at', 'updated_at', 'created_by'].includes(col.name)
    );
  }, [columns]);

  const toggleColumn = useCallback((columnName: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnName)
        ? prev.filter(c => c !== columnName)
        : [...prev, columnName]
    );
  }, []);

  const getRecordValue = useCallback((record: TableRecord, columnName: string): string => {
    // Check direct properties first (name, email, company, status)
    if (record[columnName] !== undefined && record[columnName] !== null && record[columnName] !== '') {
      return String(record[columnName]).toLowerCase().trim();
    }
    
    // Check JSONB data field
    const data = record.data || {};
    
    // Handle nested data.data structure (bug in API response)
    const actualData = data.data || data;
    
    if (actualData[columnName] !== undefined && actualData[columnName] !== null && actualData[columnName] !== '') {
      return String(actualData[columnName]).toLowerCase().trim();
    }
    
    return '';
  }, []);

  // Calculate match score for individual record against the base record
  const calculateRecordMatchScore = useCallback((baseRecord: TableRecord, compareRecord: TableRecord, columnsToCompare: string[]): number => {
    const searchText = columnsToCompare
      .map(col => getRecordValue(baseRecord, col))
      .filter(v => v !== '')
      .join(' ');

    if (!searchText) return 0;

    const fuse = new Fuse([compareRecord], {
      keys: columnsToCompare.map(col => ({
        name: col,
        getFn: (record: TableRecord) => getRecordValue(record, col)
      })),
      threshold: 0.2,
      includeScore: true,
    });

    const result = fuse.search(searchText);
    if (result.length > 0 && result[0].score !== undefined) {
      return Math.round((1 - result[0].score) * 100);
    }
    
    return 100;
  }, [getRecordValue]);

  const findDuplicates = useCallback(() => {
    if (selectedColumns.length === 0) {
      alert('少なくとも1つの列を選択してください');
      return;
    }

    setIsProcessing(true);

    // Records are already filtered (selected rows only)
    const realRecords = records;
    
    console.log('[Deduplication] Analyzing', realRecords.length, 'selected records for columns:', selectedColumns);

    if (matchType === 'exact') {
      // Exact match deduplication
      const groups = new Map<string, TableRecord[]>();

      realRecords.forEach(record => {
        const values = selectedColumns.map(col => getRecordValue(record, col));
        const key = values.filter(v => v !== '').join('|');

        if (key) {
          if (!groups.has(key)) {
            groups.set(key, []);
          }
          groups.get(key)!.push(record);
        }
      });

      // Only keep groups with duplicates
      const duplicates: DuplicateGroup[] = Array.from(groups.values())
        .filter(group => group.length > 1)
        .map(records => ({ records }));

      console.log('[Deduplication] Found', duplicates.length, 'duplicate groups from', groups.size, 'unique keys');

      setDuplicateGroups(duplicates);

      // Auto-select all but the first record in each group
      const toDelete = new Set<string>();
      duplicates.forEach(group => {
        group.records.slice(1).forEach(record => toDelete.add(record.id));
      });
      setSelectedToDelete(toDelete);

    } else {
      // Fuzzy match deduplication
      const duplicates: DuplicateGroup[] = [];
      const processed = new Set<string>();

      realRecords.forEach((record, index) => {
        if (processed.has(record.id)) return;

        const searchText = selectedColumns
          .map(col => getRecordValue(record, col))
          .filter(v => v !== '')
          .join(' ');

        if (!searchText) return;

        // Create Fuse instance for remaining records
        const remainingRecords = realRecords.slice(index + 1).filter(r => !processed.has(r.id));
        
        const fuse = new Fuse(remainingRecords, {
          keys: selectedColumns.map(col => {
            return {
              name: col,
              getFn: (record: TableRecord) => getRecordValue(record, col)
            };
          }),
          threshold: 0.2, // 80% similarity (lower threshold = more strict)
          includeScore: true,
        });

        const matches = fuse.search(searchText);

        if (matches.length > 0) {
          const group: DuplicateGroup = {
            records: [record, ...matches.map(m => m.item)],
            confidence: matches.length > 0 ? Math.round((1 - (matches[0].score || 0)) * 100) : 100,
          };

          duplicates.push(group);
          processed.add(record.id);
          matches.forEach(m => processed.add(m.item.id));
        }
      });

      // Sort by confidence (lowest first for review)
      duplicates.sort((a, b) => (a.confidence || 100) - (b.confidence || 100));

      setDuplicateGroups(duplicates);

      // For fuzzy match, don't auto-select - let user review
      setSelectedToDelete(new Set());
    }

    setIsProcessing(false);
    setStep('preview');
  }, [selectedColumns, matchType, records, getRecordValue]);

  const toggleRecordSelection = useCallback((recordId: string) => {
    setSelectedToDelete(prev => {
      const next = new Set(prev);
      if (next.has(recordId)) {
        next.delete(recordId);
      } else {
        next.add(recordId);
      }
      return next;
    });
  }, []);

  const handleConfirm = async () => {
    if (selectedToDelete.size === 0) {
      alert('削除するレコードを選択してください');
      return;
    }

    setIsProcessing(true);
    try {
      await onConfirm(Array.from(selectedToDelete));
      onOpenChange(false);
      // Reset state
      setStep('config');
      setSelectedColumns([]);
      setMatchType('exact');
      setDuplicateGroups([]);
      setSelectedToDelete(new Set());
    } catch (error) {
      console.error('Error deleting duplicates:', error);
      alert('重複の削除に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (step === 'preview') {
      setStep('config');
      setDuplicateGroups([]);
      setSelectedToDelete(new Set());
    } else {
      // Close modal without resetting - this preserves row selection
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    // Reset state when modal is fully closed
    setStep('config');
    setSelectedColumns([]);
    setMatchType('exact');
    setDuplicateGroups([]);
    setSelectedToDelete(new Set());
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          // Reset state when modal closes
          handleClose();
        }
      }}
    >
      <DialogContent className="!max-w-[90vw] w-[90vw] max-h-[90vh] overflow-hidden flex flex-col bg-white border border-[#E4E4E7] rounded-2xl shadow-[12px_12px_20px_-2px_rgba(0,0,0,0.09),6px_6px_10px_-2px_rgba(0,0,0,0.32)]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-medium text-[#09090B]">
            {step === 'config' ? '重複データの検出' : '重複データのプレビュー'}
          </DialogTitle>
          {step === 'config' && (
            <p className="text-xs text-[#71717B] ">
              {records.length} 件のレコードから重複を検出
            </p>
          )}
        </DialogHeader>

        {step === 'config' && (
          <div className="space-y-8 overflow-y-auto flex-1 pr-2">
            {/* Match Type Selection */}
            <div className="space-y-2">
              <Label className="text-base font-medium text-[#09090B]">検出方法</Label>
              <RadioGroup value={matchType} onValueChange={(v) => setMatchType(v as 'exact' | 'fuzzy')}>
                <label 
                  htmlFor="exact"
                  className={`flex items-start mt-3 space-x-4 p-3 border rounded-xl bg-white transition-all cursor-pointer ${
                    matchType === 'exact' 
                      ? 'border-[#09090B]' 
                      : 'border-[#E4E4E7] hover:border-[#71717B]'
                  }`}
                >
                  <RadioGroupItem value="exact" id="exact" className="mt-1" />
                  <div className="flex-1">
                    <div className="font-medium text-base text-[#09090B]">
                      完全一致
                    </div>
                    <p className="text-xs text-[#71717B] leading-relaxed">
                      選択した列の値が完全に一致するレコードを検出
                    </p>
                  </div>
                </label>
                
                <label 
                  htmlFor="fuzzy"
                  className={`flex items-start space-x-4 p-3 border rounded-xl bg-white transition-all cursor-pointer ${
                    matchType === 'fuzzy' 
                      ? 'border-[#09090B]' 
                      : 'border-[#E4E4E7] hover:border-[#71717B]'
                  }`}
                >
                  <RadioGroupItem value="fuzzy" id="fuzzy" className="mt-1" />
                  <div className="flex-1">
                    <div className="font-medium text-base text-[#09090B]">
                      類似検出
                    </div>
                    <p className="text-xs text-[#71717B] leading-relaxed">
                      類似したレコードを自動検出（80%以上の類似度）
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* Column Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium text-[#09090B]">比較する列</Label>
                {selectedColumns.length > 0 && (
                  <span className="text-sm text-[#71717B]">
                    {selectedColumns.length}列選択中
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 border border-[#E4E4E7] rounded-xl p-5 bg-white">
                {availableColumns.length === 0 ? (
                  <div className="col-span-2 text-center py-6 text-sm text-[#A1A1AA]">
                    比較可能な列がありません
                  </div>
                ) : (
                  availableColumns.map(column => (
                    <label 
                      key={column.name}
                      htmlFor={`col-${column.name}`}
                      className="flex items-center space-x-3 cursor-pointer group"
                    >
                      <Checkbox
                        id={`col-${column.name}`}
                        checked={selectedColumns.includes(column.name)}
                        onCheckedChange={() => toggleColumn(column.name)}
                      />
                      <span className="text-sm text-[#09090B] group-hover:text-[#27272A] transition-colors">
                        {column.label}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-5 overflow-y-auto flex-1 pr-2">
            {duplicateGroups.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="text-base font-medium text-[#09090B]">重複データが見つかりませんでした</div>
                <div className="text-sm text-[#71717B]">
                  選択された {records.length} 件のレコードに{matchType === 'exact' ? '完全に一致する' : '類似した'}データはありません
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 bg-[#FAFAFA] rounded-xl border border-[#E4E4E7]">
                  <div>
                    <div className="text-base font-medium text-[#09090B]">
                      {duplicateGroups.length}件の重複グループ
                    </div>
                    <div className="text-xs text-[#71717B] mt-0.5">
                      {matchType === 'fuzzy' && '類似度の低い順に表示'}
                    </div>
                  </div>
                  {selectedToDelete.size > 0 && (
                    <div className="text-sm text-[#71717B]">
                      {selectedToDelete.size}件削除予定
                    </div>
                  )}
                </div>
                
                {duplicateGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="border border-[#E4E4E7] rounded-xl overflow-hidden bg-white">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E4E7] bg-[#FAFAFA]">
                      <span className="text-base font-medium text-[#09090B]">
                        グループ {groupIndex + 1}
                      </span>
                      <span className="text-sm text-[#71717B]">
                        {group.records.length}件のレコード
                      </span>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max">
                        <thead>
                          <tr className="border-b border-[#E4E4E7]">
                            <th className="sticky left-0 z-10 text-left px-4 py-3 text-xs font-medium text-[#71717B] uppercase tracking-wide bg-[#FAFAFA] min-w-[60px]">
                              選択
                            </th>
                            <th className="sticky left-[60px] z-10 text-left px-4 py-3 text-xs font-medium text-[#71717B] uppercase tracking-wide bg-[#FAFAFA] min-w-[100px]">
                              状態
                            </th>
                            {matchType === 'fuzzy' && (
                              <th className="sticky left-[160px] z-10 text-left px-4 py-3 text-xs font-medium text-[#71717B] uppercase tracking-wide bg-[#FAFAFA] min-w-[100px]">
                                類似度
                              </th>
                            )}
                            {availableColumns.map(column => (
                              <th key={column.name} className="text-left px-4 py-3 text-xs font-medium text-[#71717B] uppercase tracking-wide bg-[#FAFAFA] min-w-[150px] whitespace-nowrap">
                                {column.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {group.records.map((record, recordIndex) => {
                            const recordMatchScore = matchType === 'fuzzy' && recordIndex > 0 
                              ? calculateRecordMatchScore(group.records[0], record, selectedColumns)
                              : 100;
                            
                            return (
                              <tr 
                                key={record.id}
                                className={`border-b border-[#E4E4E7] last:border-b-0 transition-colors ${
                                  recordIndex === 0 
                                    ? 'bg-[#FAFAFA]' 
                                    : selectedToDelete.has(record.id)
                                    ? 'bg-white'
                                    : 'bg-white hover:bg-[#FAFAFA]'
                                }`}
                              >
                                <td className="sticky left-0 z-10 px-4 py-4 bg-inherit">
                                  <Checkbox
                                    id={`record-${record.id}`}
                                    checked={selectedToDelete.has(record.id)}
                                    onCheckedChange={() => toggleRecordSelection(record.id)}
                                    disabled={recordIndex === 0 && matchType === 'exact'}
                                  />
                                </td>
                                <td className="sticky left-[60px] z-10 px-4 py-4 bg-inherit">
                                  {recordIndex === 0 ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-[#E4E4E7] text-xs font-medium text-[#09090B] whitespace-nowrap">
                                      保持
                                    </span>
                                  ) : selectedToDelete.has(record.id) ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-[#09090B] text-xs font-medium text-[#09090B] whitespace-nowrap">
                                      削除
                                    </span>
                                  ) : (
                                    <span className="text-xs text-[#A1A1AA]">—</span>
                                  )}
                                </td>
                                {matchType === 'fuzzy' && (
                                  <td className="sticky left-[160px] z-10 px-4 py-4 bg-inherit">
                                    <span className="text-sm font-medium text-[#09090B] whitespace-nowrap">
                                      {recordMatchScore}%
                                    </span>
                                  </td>
                                )}
                                {availableColumns.map(column => {
                                  const value = getRecordValue(record, column.name);
                                  const isComparedColumn = selectedColumns.includes(column.name);
                                  
                                  return (
                                    <td 
                                      key={column.name} 
                                      className={`px-4 py-4 text-sm whitespace-nowrap ${
                                        isComparedColumn 
                                          ? 'text-[#09090B] font-medium' 
                                          : 'text-[#71717B]'
                                      }`}
                                    >
                                      {value || <span className="text-[#A1A1AA]">—</span>}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        <div className="flex justify-between items-center pt-6 border-t border-[#E4E4E7]">
          <div className="text-sm text-[#71717B]">
            {step === 'preview' && selectedToDelete.size > 0 && (
              <span>{selectedToDelete.size}件のレコードを削除</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isProcessing}
            >
              {step === 'preview' ? '戻る' : 'キャンセル'}
            </Button>
            {step === 'config' ? (
              <Button
                onClick={findDuplicates}
                disabled={selectedColumns.length === 0 || isProcessing}
              >
                {isProcessing ? '検出中...' : '重複を検出'}
              </Button>
            ) : (
              <Button
                onClick={handleConfirm}
                disabled={selectedToDelete.size === 0 || isProcessing}
                className="bg-[#09090B] hover:bg-[#27272A]"
              >
                {isProcessing ? '削除中...' : '確認して削除'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
