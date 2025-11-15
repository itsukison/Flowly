'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

const COLOR_OPTIONS = [
  { name: 'グレー', value: '#94a3b8' },
  { name: 'ブルー', value: '#3b82f6' },
  { name: 'グリーン', value: '#10b981' },
  { name: 'パープル', value: '#8b5cf6' },
  { name: 'レッド', value: '#ef4444' },
  { name: 'イエロー', value: '#f59e0b' },
  { name: 'ピンク', value: '#ec4899' },
  { name: 'インディゴ', value: '#6366f1' },
]

export default function AddStatusModal({ tableId, existingStatuses, onClose }: any) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLOR_OPTIONS[0].value)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('ステータス名を入力してください')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/statuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_id: tableId,
          name: name.trim(),
          color,
          display_order: existingStatuses.length + 1,
        }),
      })

      if (!response.ok) throw new Error('Failed to create status')

      router.refresh()
      onClose()
    } catch (err) {
      setError('ステータスの作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#09090B]">ステータスを追加</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#F4F4F5] rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#09090B] mb-2">
              ステータス名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 商談中"
              className="w-full px-4 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#09090B]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#09090B] mb-2">
              カラー
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_OPTIONS.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => setColor(colorOption.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    color === colorOption.value
                      ? 'border-[#09090B] scale-105'
                      : 'border-[#E4E4E7] hover:border-[#71717B]'
                  }`}
                >
                  <div
                    className="w-full h-6 rounded"
                    style={{ backgroundColor: colorOption.value }}
                  />
                  <p className="text-xs text-[#71717B] mt-1 text-center">
                    {colorOption.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5]"
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#09090B] text-white rounded-lg hover:bg-[#27272A] disabled:opacity-50"
            >
              {loading ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
