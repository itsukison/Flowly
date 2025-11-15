'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { validateRow, transformRows } from '@/lib/utils/dataTransform'

interface ImportPreviewProps {
  rows: Record<string, any>[]
  mappings: Record<string, string>
  organizationId: string
  userId: string
  onComplete: (validRows: any[], invalidRows: any[]) => void
  onBack: () => void
}

export default function ImportPreview({
  rows,
  mappings,
  organizationId,
  userId,
  onComplete,
  onBack,
}: ImportPreviewProps) {
  const [validRows, setValidRows] = useState<any[]>([])
  const [invalidRows, setInvalidRows] = useState<any[]>([])
  const [validating, setValidating] = useState(true)

  useEffect(() => {
    validateData()
  }, [])

  const validateData = () => {
    const valid: any[] = []
    const invalid: any[] = []

    rows.forEach((row, index) => {
      const errors = validateRow(row, index + 1, mappings)
      
      if (errors.length === 0) {
        valid.push(row)
      } else {
        invalid.push({ row, errors, rowNumber: index + 1 })
      }
    })

    setValidRows(valid)
    setInvalidRows(invalid)
    setValidating(false)
  }

  const transformedRows = validRows.length > 0
    ? transformRows(validRows, mappings, organizationId, userId)
    : []

  const handleContinue = () => {
    onComplete(transformedRows, invalidRows)
  }

  if (validating) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-[#E4E4E7] border-t-[#09090B] rounded-full mx-auto mb-4" />
        <p className="text-[#71717B]">データを検証中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#09090B] mb-2">
          プレビュー & 検証
        </h2>
        <p className="text-[#71717B]">
          インポートするデータを確認してください
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl p-4">
          <p className="text-sm text-[#71717B] mb-1">総行数</p>
          <p className="text-2xl font-bold text-[#09090B]">{rows.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-700 mb-1">有効な行</p>
          <p className="text-2xl font-bold text-green-700">{validRows.length}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700 mb-1">エラーのある行</p>
          <p className="text-2xl font-bold text-red-700">{invalidRows.length}</p>
        </div>
      </div>

      {/* Error Details */}
      {invalidRows.length > 0 && (
        <div className="border border-red-200 rounded-xl p-4 bg-red-50">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-700" />
            <h3 className="font-semibold text-red-700">
              {invalidRows.length}件のエラーが見つかりました
            </h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {invalidRows.slice(0, 10).map((item, index) => (
              <div key={index} className="bg-white rounded-lg p-3 text-sm">
                <p className="font-semibold text-red-700 mb-1">
                  行 {item.rowNumber}:
                </p>
                <ul className="list-disc list-inside text-red-600 space-y-1">
                  {item.errors.map((error: any, idx: number) => (
                    <li key={idx}>{error.error}</li>
                  ))}
                </ul>
              </div>
            ))}
            {invalidRows.length > 10 && (
              <p className="text-xs text-red-600 text-center pt-2">
                他 {invalidRows.length - 10}件のエラー
              </p>
            )}
          </div>
          <p className="text-sm text-red-700 mt-3">
            エラーのある行はスキップされます。有効な行のみインポートされます。
          </p>
        </div>
      )}

      {/* Preview Table */}
      {validRows.length > 0 && (
        <div>
          <h3 className="font-semibold text-[#09090B] mb-3">
            プレビュー（最初の10行）
          </h3>
          <div className="border border-[#E4E4E7] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7]">
                  <tr>
                    {Object.keys(mappings)
                      .filter(k => mappings[k])
                      .map((sourceCol) => (
                        <th key={sourceCol} className="px-4 py-3 text-left font-semibold text-[#09090B]">
                          {mappings[sourceCol]}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E7]">
                  {transformedRows.slice(0, 10).map((row, index) => (
                    <tr key={index} className="hover:bg-[#FAFAFA]">
                      {Object.keys(mappings)
                        .filter(k => mappings[k])
                        .map((sourceCol) => {
                          const field = mappings[sourceCol]
                          return (
                            <td key={sourceCol} className="px-4 py-3 text-[#71717B]">
                              {row[field] || '-'}
                            </td>
                          )
                        })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {validRows.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#09090B] mb-2">
            有効な行がありません
          </h3>
          <p className="text-[#71717B]">
            すべての行にエラーがあります。ファイルを修正して再度アップロードしてください。
          </p>
        </div>
      )}

      <div className="flex items-center gap-4 pt-4">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border border-[#E4E4E7] rounded-xl font-semibold hover:bg-[#F4F4F5] transition-colors"
        >
          戻る
        </button>
        <button
          onClick={handleContinue}
          disabled={validRows.length === 0}
          className="flex-1 px-6 py-3 bg-[#09090B] text-white rounded-xl font-semibold hover:bg-[#27272A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          次へ：重複確認
        </button>
      </div>
    </div>
  )
}
