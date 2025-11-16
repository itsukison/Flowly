"use client";

import { useState, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Column {
  id: string;
  name: string;
  label: string;
  type: string;
}

interface DeduplicationConfigProps {
  columns: Column[];
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  selectedColumns: string[];
  onSelectedColumnsChange: (columns: string[]) => void;
  matchType: "exact" | "fuzzy";
  onMatchTypeChange: (type: "exact" | "fuzzy") => void;
}

export function DeduplicationConfig({
  columns,
  enabled,
  onEnabledChange,
  selectedColumns,
  onSelectedColumnsChange,
  matchType,
  onMatchTypeChange,
}: DeduplicationConfigProps) {
  // Filter out system columns
  const availableColumns = columns.filter(col => 
    !['id', 'table_id', 'organization_id', 'created_at', 'updated_at', 'created_by'].includes(col.name)
  );

  const toggleColumn = useCallback((columnName: string) => {
    onSelectedColumnsChange(
      selectedColumns.includes(columnName)
        ? selectedColumns.filter(c => c !== columnName)
        : [...selectedColumns, columnName]
    );
  }, [selectedColumns, onSelectedColumnsChange]);

  return (
    <div className="border border-[#E4E4E7] rounded-xl overflow-hidden bg-white">
      {/* Header with toggle */}
      <div className="p-5 border-b border-[#E4E4E7] bg-[#FAFAFA]">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={enabled}
            onCheckedChange={onEnabledChange}
            className="mt-0.5"
          />
          <div className="flex-1">
            <div className="font-medium text-base text-[#09090B]">
              重複データを検出
            </div>
            <p className="text-sm text-[#71717B] mt-1">
              インポート前に重複レコードを検出して削除します
            </p>
          </div>
        </label>
      </div>

      {/* Configuration (shown when enabled) */}
      {enabled && (
        <div className="p-5 space-y-6">
          {/* Match Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-[#09090B]">検出方法</Label>
            <RadioGroup value={matchType} onValueChange={(v) => onMatchTypeChange(v as 'exact' | 'fuzzy')}>
              <label 
                htmlFor="dedup-exact"
                className={`flex items-start space-x-3 p-4 border rounded-lg bg-white transition-all cursor-pointer ${
                  matchType === 'exact' 
                    ? 'border-[#09090B]' 
                    : 'border-[#E4E4E7] hover:border-[#71717B]'
                }`}
              >
                <RadioGroupItem value="exact" id="dedup-exact" className="mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-sm text-[#09090B]">
                    完全一致
                  </div>
                  <p className="text-xs text-[#71717B] leading-relaxed mt-0.5">
                    選択した列の値が完全に一致するレコードを検出
                  </p>
                </div>
              </label>
              
              <label 
                htmlFor="dedup-fuzzy"
                className={`flex items-start space-x-3 p-4 border rounded-lg bg-white transition-all cursor-pointer ${
                  matchType === 'fuzzy' 
                    ? 'border-[#09090B]' 
                    : 'border-[#E4E4E7] hover:border-[#71717B]'
                }`}
              >
                <RadioGroupItem value="fuzzy" id="dedup-fuzzy" className="mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-sm text-[#09090B]">
                    類似検出
                  </div>
                  <p className="text-xs text-[#71717B] leading-relaxed mt-0.5">
                    類似したレコードを自動検出（80%以上の類似度）
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* Column Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-[#09090B]">比較する列</Label>
              {selectedColumns.length > 0 && (
                <span className="text-xs text-[#71717B]">
                  {selectedColumns.length}列選択中
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 border border-[#E4E4E7] rounded-lg p-4 bg-[#FAFAFA]">
              {availableColumns.length === 0 ? (
                <div className="col-span-2 text-center py-4 text-sm text-[#A1A1AA]">
                  比較可能な列がありません
                </div>
              ) : (
                availableColumns.map(column => (
                  <label 
                    key={column.name}
                    htmlFor={`dedup-col-${column.name}`}
                    className="flex items-center space-x-2 cursor-pointer group"
                  >
                    <Checkbox
                      id={`dedup-col-${column.name}`}
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
    </div>
  );
}
