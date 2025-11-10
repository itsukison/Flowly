'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { ICON_OPTIONS, getIconComponent } from '@/lib/iconMapping'

interface Table {
  id: string
  name: string
  icon: string | null
  description: string | null
}

interface EditTableModalProps {
  table: Table
  onClose: () => void
}

export default function EditTableModal({ table, onClose }: EditTableModalProps) {
  const router = useRouter()
  const [name, setName] = useState(table.name)
  const [description, setDescription] = useState(table.description || '')
  // Convert legacy emoji to icon name
  const emojiToIconMap: Record<string, string> = {
    '👥': 'users', '📦': 'package', '🎫': 'ticket', '📊': 'chart',
    '💼': 'briefcase', '🏢': 'building', '📝': 'file', '📞': 'phone',
    '✉️': 'mail', '🎯': 'target', '⚙️': 'settings', '🔧': 'wrench',
  }
  const initialIcon = table.icon && emojiToIconMap[table.icon] ? emojiToIconMap[table.icon] : (table.icon || 'chart')
  const [icon, setIcon] = useState(initialIcon)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpdate = async () => {
    if (!name.trim()) {
      setError('テーブル名を入力してください')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/tables/${table.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          icon,
        }),
      })

      if (!response.ok) {
        throw new Error('テーブルの更新に失敗しました')
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[10px] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-[12px_12px_20px_-2px_rgba(0,0,0,0.09),6px_6px_10px_-2px_rgba(0,0,0,0.32),3px_3px_5px_-1px_rgba(0,0,0,0.41)]">
        <div className="border-b border-[#E4E4E7] px-8 py-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#09090B]">テーブルを編集</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F4F4F5] rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-[#71717B]" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <label className="block text-base font-bold text-[#09090B] mb-4">
              アイコン
            </label>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {ICON_OPTIONS.map((iconOption) => {
                const IconComponent = iconOption.Icon
                return (
                  <button
                    key={iconOption.name}
                    type="button"
                    onClick={() => setIcon(iconOption.name)}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      icon === iconOption.name
                        ? 'border-[#09090B] bg-[#F4F4F5]'
                        : 'border-[#E4E4E7] hover:border-[#71717B] hover:bg-[#FAFAFA]'
                    }`}
                    title={iconOption.label}
                  >
                    <IconComponent className={`w-6 h-6 ${icon === iconOption.name ? 'text-[#09090B]' : 'text-[#71717B]'}`} />
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-base font-bold text-[#09090B] mb-3">
              テーブル名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 text-base border border-[#E4E4E7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#09090B] focus:border-[#09090B] transition-all"
            />
          </div>

          <div>
            <label className="block text-base font-bold text-[#09090B] mb-3">
              説明（任意）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-5 py-4 text-base border border-[#E4E4E7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#09090B] focus:border-[#09090B] transition-all leading-[1.6]"
            />
          </div>

          {error && (
            <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-base text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 border border-[#E4E4E7] rounded-xl text-base font-semibold hover:bg-[#F4F4F5] transition-colors"
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              onClick={handleUpdate}
              disabled={loading || !name.trim()}
              className="flex-1 px-6 py-4 bg-[#09090B] text-white rounded-xl text-base font-bold hover:bg-[#27272A] transition-colors disabled:opacity-50 shadow-[0px_4px_20px_rgba(0,0,0,0.15)]"
            >
              {loading ? '更新中...' : '更新'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
