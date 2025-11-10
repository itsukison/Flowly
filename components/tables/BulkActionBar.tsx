'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Download, RefreshCw, Sparkles, X } from 'lucide-react'
import BulkDeleteModal from './BulkDeleteModal'
import BulkStatusModal from './BulkStatusModal'

interface BulkActionBarProps {
  selectedCount: number
  selectedIds: string[]
  statuses: any[]
  tableId: string
  onComplete: () => void
}

export default function BulkActionBar({
  selectedCount,
  selectedIds,
  statuses,
  tableId,
  onComplete,
}: BulkActionBarProps) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('エクスポートに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDeduplicate = async () => {
    if (!confirm(`${selectedCount}件のレコードから重複を検出しますか？`)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/deduplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })

      if (!response.ok) throw new Error('Deduplication failed')

      router.refresh()
      onComplete()
      alert('重複検出が完了しました')
    } catch (error) {
      console.error('Deduplication error:', error)
      alert('重複検出に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleEnrich = async () => {
    if (!confirm(`${selectedCount}件のレコードをエンリッチしますか？`)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })

      if (!response.ok) throw new Error('Enrichment failed')

      router.refresh()
      onComplete()
      alert('エンリッチメントをキューに追加しました')
    } catch (error) {
      console.error('Enrichment error:', error)
      alert('エンリッチメントに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-[#09090B] text-white shadow-lg z-40 border-t border-[#27272A]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-semibold">{selectedCount}件選択中</span>
              <button
                onClick={onComplete}
                className="p-2 hover:bg-[#27272A] rounded-lg transition-colors"
                title="選択を解除"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStatusModal(true)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#27272A] hover:bg-[#3f3f46] rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden md:inline">ステータス変更</span>
              </button>

              <button
                onClick={handleDeduplicate}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#27272A] hover:bg-[#3f3f46] rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden md:inline">重複検出</span>
              </button>

              <button
                onClick={handleEnrich}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#27272A] hover:bg-[#3f3f46] rounded-lg transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden md:inline">エンリッチ</span>
              </button>

              <button
                onClick={handleExport}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#27272A] hover:bg-[#3f3f46] rounded-lg transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">エクスポート</span>
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden md:inline">削除</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <BulkDeleteModal
          selectedCount={selectedCount}
          selectedIds={selectedIds}
          onClose={() => setShowDeleteModal(false)}
          onComplete={onComplete}
        />
      )}

      {showStatusModal && (
        <BulkStatusModal
          selectedCount={selectedCount}
          selectedIds={selectedIds}
          statuses={statuses}
          onClose={() => setShowStatusModal(false)}
          onComplete={onComplete}
        />
      )}
    </>
  )
}
