'use client'

import { useState } from 'react'
import { AlertTriangle, Info, CheckCircle } from 'lucide-react'

interface DataPreviewProps {
  data: any[]
  mapping: Record<string, string>
  detectionResults: {
    duplicates: any[]
    missingEmail: any[]
    missingPhone: any[]
    totalRows: number
  }
  onImport: (options: { deduplicate: boolean; enrich: boolean }) => void
  onBack: () => void
}

export default function DataPreview({
  data,
  mapping,
  detectionResults,
  onImport,
  onBack,
}: DataPreviewProps) {
  const [deduplicate, setDeduplicate] = useState(false)
  const [enrich, setEnrich] = useState(false)

  const hasDuplicates = detectionResults.duplicates.length > 0
  const hasMissingData = detectionResults.missingEmail.length > 0 || detectionResults.missingPhone.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#09090B] mb-2">
          データプレビュー
        </h2>
        <p className="text-[#71717B]">
          {detectionResults.totalRows}行のデータをインポート準備完了
        </p>
      </div>

      {/* Detection Results */}
      <div className="space-y-4">
        {/* Success Message */}
        {!hasDuplicates && !hasMissingData && (
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-900 mb-1">
                データに問題はありません
              </p>
              <p className="text-sm text-green-700">
                すべてのレコードをそのままインポートできます
              </p>
            </div>
          </div>
        )}

        {/* Duplicates Warning */}
        {hasDuplicates && (
          <div className="border border-[#E4E4E7] rounded-lg overflow-hidden">
            <div className="flex items-start gap-3 p-4 bg-orange-50 border-b border-orange-200">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-orange-900 mb-1">
                  {detectionResults.duplicates.length}件の重複の可能性
                </p>
                <p className="text-sm text-orange-700">
                  同じ名前のレコードが見つかりました
                </p>
              </div>
            </div>
            <div className="p-4 bg-white">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deduplicate}
                  onChange={(e) => setDeduplicate(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-[#E4E4E7] text-[#09090B] focus:ring-[#09090B]"
                />
                <div>
                  <p className="font-medium text-[#09090B]">重複を自動マージ</p>
                  <p className="text-sm text-[#71717B] mt-1">
                    重複レコードを検出して、最新の情報でマージします
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Missing Data Info */}
        {hasMissingData && (
          <div className="border border-[#E4E4E7] rounded-lg overflow-hidden">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border-b border-blue-200">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-blue-900 mb-1">
                  不足データが見つかりました
                </p>
                <div className="text-sm text-blue-700 space-y-1">
                  {detectionResults.missingEmail.length > 0 && (
                    <p>• {detectionResults.missingEmail.length}件のレコードにメールアドレスがありません</p>
                  )}
                  {detectionResults.missingPhone.length > 0 && (
                    <p>• {detectionResults.missingPhone.length}件のレコードに電話番号がありません</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 bg-white">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enrich}
                  onChange={(e) => setEnrich(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-[#E4E4E7] text-[#09090B] focus:ring-[#09090B]"
                />
                <div>
                  <p className="font-medium text-[#09090B]">データを自動補完</p>
                  <p className="text-sm text-[#71717B] mt-1">
                    不足している情報を外部データソースから自動的に取得します
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Preview Table */}
      <div>
        <h3 className="font-semibold text-[#09090B] mb-3">データプレビュー（最初の5行）</h3>
        <div className="border border-[#E4E4E7] rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F4F4F5] border-b border-[#E4E4E7]">
              <tr>
                {Object.values(mapping).map((field) => (
                  <th
                    key={field}
                    className="px-4 py-2 text-left text-xs font-medium text-[#71717B] uppercase"
                  >
                    {field}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7]">
              {data.slice(0, 5).map((row, index) => (
                <tr key={index} className="hover:bg-[#FAFAFA]">
                  {Object.entries(mapping).map(([sourceCol, targetField]) => (
                    <td key={targetField} className="px-4 py-2 text-sm text-[#09090B]">
                      {row[sourceCol] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length > 5 && (
          <p className="text-sm text-[#71717B] mt-2">
            ...他 {data.length - 5} 行
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors font-medium"
        >
          戻る
        </button>
        <button
          onClick={() => onImport({ deduplicate, enrich })}
          className="flex-1 px-4 py-3 bg-[#09090B] text-white rounded-lg hover:bg-[#27272A] transition-colors font-medium"
        >
          インポート開始
        </button>
      </div>
    </div>
  )
}
