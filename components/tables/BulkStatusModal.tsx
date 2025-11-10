'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

interface BulkStatusModalProps {
  selectedCount: number
  selectedIds: string[]
  statuses: any[]
  onClose: () => void
  onComplete: () => void
}

export default function BulkStatusModal({
  selectedCount,
  selectedIds,
  statuses,
  onClose,
  onComplete,
}: BulkStatusModalProps) {
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpdate = async () => {
    if (!selectedStatus) {
      setError('ステータスを選択してください')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/customers/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          updates: { status: selectedStatus },
        }),
      })

      if (!response.ok) throw new Error('Bulk update failed')

      router.refresh()
      onComplete()
      onClose()
    } catch (err) {
      setError('更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#09090B]">ステータス一括変更</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F4F4F5] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-[#71717B]">
            {selectedCount}件のレコードのステータスを変更します
          </p>

          <div>
            <label className="block text-sm font-medium text-[#09090B] mb-2">
              新しいステータス
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#09090B]"
            >
              <option value="">選択してください</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.name}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors"
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              onClick={handleUpdate}
              disabled={loading || !selectedStatus}
              className="flex-1 px-4 py-2 bg-[#09090B] text-white rounded-lg hover:bg-[#27272A] transition-colors disabled:opacity-50"
            >
              {loading ? '更新中...' : '更新'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
