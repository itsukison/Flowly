'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, AlertTriangle } from 'lucide-react'

interface Table {
  id: string
  name: string
}

interface DeleteTableModalProps {
  table: Table
  onClose: () => void
}

export default function DeleteTableModal({ table, onClose }: DeleteTableModalProps) {
  const router = useRouter()
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    if (confirmText !== table.name) {
      setError('テーブル名が一致しません')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/tables/${table.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('テーブルの削除に失敗しました')
      }

      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#09090B]">テーブルを削除</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F4F4F5] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-600">
              <p className="font-semibold mb-1">この操作は取り消せません</p>
              <p>
                テーブル「{table.name}」とそのすべてのレコードが完全に削除されます。
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#09090B] mb-2">
              確認のため、テーブル名を入力してください
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={table.name}
              className="w-full px-4 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
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
              onClick={handleDelete}
              disabled={loading || confirmText !== table.name}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? '削除中...' : '削除'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
