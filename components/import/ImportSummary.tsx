'use client'

import { useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle, Download } from 'lucide-react'

interface ImportSummaryProps {
  result: {
    success: number
    failed: number
    skipped: number
    errors: Array<{ row: number; error: string }>
  }
  totalRows: number
  onStartOver: () => void
}

export default function ImportSummary({ result, totalRows, onStartOver }: ImportSummaryProps) {
  const router = useRouter()

  const handleViewCustomers = () => {
    router.push('/dashboard/customers')
    router.refresh()
  }

  const handleDownloadErrors = () => {
    if (result.errors.length === 0) return

    const errorText = result.errors
      .map(e => `行 ${e.row}: ${e.error}`)
      .join('\n')

    const blob = new Blob([errorText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'import-errors.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasErrors = result.failed > 0 || result.errors.length > 0

  return (
    <div className="space-y-6">
      <div className="text-center">
        {!hasErrors ? (
          <>
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-[#09090B] mb-2">
              インポート完了！
            </h2>
            <p className="text-[#71717B]">
              すべてのデータが正常にインポートされました
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-12 h-12 text-yellow-600" />
            </div>
            <h2 className="text-3xl font-bold text-[#09090B] mb-2">
              インポート完了（一部エラー）
            </h2>
            <p className="text-[#71717B]">
              一部のデータにエラーがありました
            </p>
          </>
        )}
      </div>

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <p className="text-sm text-green-700 mb-2">成功</p>
          <p className="text-4xl font-bold text-green-700">{result.success}</p>
          <p className="text-xs text-green-600 mt-2">件のデータをインポート</p>
        </div>

        {result.skipped > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <p className="text-sm text-blue-700 mb-2">スキップ</p>
            <p className="text-4xl font-bold text-blue-700">{result.skipped}</p>
            <p className="text-xs text-blue-600 mt-2">件（重複）</p>
          </div>
        )}

        {hasErrors && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-sm text-red-700 mb-2">エラー</p>
            <p className="text-4xl font-bold text-red-700">{result.failed}</p>
            <p className="text-xs text-red-600 mt-2">件のエラー</p>
          </div>
        )}
      </div>

      {/* Processing Time */}
      <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl p-4 text-center">
        <p className="text-sm text-[#71717B]">
          {totalRows}行中 {result.success}行を正常にインポートしました
        </p>
      </div>

      {/* Error Details */}
      {hasErrors && result.errors.length > 0 && (
        <div className="border border-red-200 rounded-xl p-4 bg-red-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-red-700">エラー詳細</h3>
            <button
              onClick={handleDownloadErrors}
              className="flex items-center gap-2 text-sm text-red-700 hover:text-red-800"
            >
              <Download className="w-4 h-4" />
              ダウンロード
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {result.errors.slice(0, 10).map((error, index) => (
              <div key={index} className="bg-white rounded-lg p-3 text-sm text-red-700">
                <strong>行 {error.row}:</strong> {error.error}
              </div>
            ))}
            {result.errors.length > 10 && (
              <p className="text-xs text-red-600 text-center pt-2">
                他 {result.errors.length - 10}件のエラー
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col md:flex-row items-center gap-4 pt-4">
        <button
          onClick={handleViewCustomers}
          className="flex-1 w-full px-6 py-3 bg-[#09090B] text-white rounded-xl font-semibold hover:bg-[#27272A] transition-colors"
        >
          顧客リストを見る
        </button>
        <button
          onClick={onStartOver}
          className="flex-1 w-full px-6 py-3 border border-[#E4E4E7] rounded-xl font-semibold hover:bg-[#F4F4F5] transition-colors"
        >
          もう一度インポート
        </button>
      </div>
    </div>
  )
}
