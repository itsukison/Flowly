'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'
import { matchAllColumns, getFieldLabel, isRequiredField, ColumnMapping } from '@/lib/utils/columnMatcher'

interface ColumnMapperProps {
  headers: string[]
  sampleRows: Record<string, any>[]
  onComplete: (mappings: ColumnMapping[]) => void
  onBack: () => void
}

const availableFields = [
  { value: '', label: 'マッピングなし' },
  { value: 'name', label: '名前 (必須)' },
  { value: 'name_furigana', label: 'フリガナ' },
  { value: 'email', label: 'メール' },
  { value: 'phone', label: '電話' },
  { value: 'company_name', label: '会社名' },
  { value: 'address', label: '住所' },
  { value: 'industry', label: '業種' },
  { value: 'employee_count', label: '従業員数' },
  { value: 'status', label: 'ステータス' },
]

export default function ColumnMapper({ headers, sampleRows, onComplete, onBack }: ColumnMapperProps) {
  const [mappings, setMappings] = useState<ColumnMapping[]>([])

  useEffect(() => {
    // Auto-map columns on mount
    const autoMappings = matchAllColumns(headers)
    setMappings(autoMappings)
  }, [headers])

  const handleMappingChange = (sourceColumn: string, targetField: string) => {
    setMappings(prev =>
      prev.map(m =>
        m.sourceColumn === sourceColumn
          ? { ...m, targetField, confidence: targetField ? 1.0 : 0 }
          : m
      )
    )
  }

  const hasRequiredFields = mappings.some(m => m.targetField === 'name')
  const unmappedCount = mappings.filter(m => !m.targetField).length

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return (
        <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
          <CheckCircle className="w-3 h-3" />
          {Math.round(confidence * 100)}%
        </span>
      )
    } else if (confidence >= 0.6) {
      return (
        <span className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">
          {Math.round(confidence * 100)}%
        </span>
      )
    } else {
      return (
        <span className="text-xs text-[#71717B] bg-[#F4F4F5] px-2 py-1 rounded-full">
          未マッピング
        </span>
      )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#09090B] mb-2">
          列をマッピング
        </h2>
        <p className="text-[#71717B]">
          インポートファイルの列をFlowlyのフィールドに対応させてください
        </p>
      </div>

      {!hasRequiredFields && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            <strong>名前</strong>フィールドは必須です。少なくとも1つの列を「名前」にマッピングしてください。
          </p>
        </div>
      )}

      {unmappedCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            {unmappedCount}個の列がマッピングされていません。必要に応じて設定してください。
          </p>
        </div>
      )}

      <div className="space-y-4">
        {mappings.map((mapping, index) => (
          <div
            key={mapping.sourceColumn}
            className="border border-[#E4E4E7] rounded-xl p-4 hover:border-[#09090B] transition-all"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-[#09090B]">
                    {mapping.sourceColumn}
                  </span>
                  {getConfidenceBadge(mapping.confidence)}
                </div>
                {sampleRows.length > 0 && (
                  <div className="text-xs text-[#71717B]">
                    例: {sampleRows[0][mapping.sourceColumn] || '(空)'}
                  </div>
                )}
              </div>

              <ArrowRight className="w-5 h-5 text-[#71717B] flex-shrink-0" />

              <div className="flex-1">
                <select
                  value={mapping.targetField}
                  onChange={(e) => handleMappingChange(mapping.sourceColumn, e.target.value)}
                  className="w-full px-4 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:border-[#09090B] transition-colors"
                >
                  {availableFields.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sample data preview */}
            {sampleRows.length > 1 && (
              <div className="pt-3 border-t border-[#E4E4E7]">
                <p className="text-xs text-[#71717B] mb-2">サンプルデータ:</p>
                <div className="space-y-1">
                  {sampleRows.slice(0, 3).map((row, idx) => (
                    <div key={idx} className="text-xs text-[#09090B] bg-[#FAFAFA] px-3 py-1 rounded">
                      {row[mapping.sourceColumn] || '(空)'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 pt-4">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border border-[#E4E4E7] rounded-xl font-semibold hover:bg-[#F4F4F5] transition-colors"
        >
          戻る
        </button>
        <button
          onClick={() => onComplete(mappings)}
          disabled={!hasRequiredFields}
          className="flex-1 px-6 py-3 bg-[#09090B] text-white rounded-xl font-semibold hover:bg-[#27272A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          次へ：プレビュー
        </button>
      </div>
    </div>
  )
}
