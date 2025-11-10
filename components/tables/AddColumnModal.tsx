'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

const FIELD_TYPES = [
  { value: 'text', label: 'テキスト' },
  { value: 'textarea', label: 'テキストエリア' },
  { value: 'number', label: '数値' },
  { value: 'email', label: 'メール' },
  { value: 'phone', label: '電話番号' },
  { value: 'url', label: 'URL' },
  { value: 'date', label: '日付' },
  { value: 'boolean', label: 'チェックボックス' },
  { value: 'select', label: 'ドロップダウン' },
  { value: 'multiselect', label: '複数選択' },
]

interface AddColumnModalProps {
  tableId: string
  existingColumns: any[]
  onClose: () => void
}

export default function AddColumnModal({ tableId, existingColumns, onClose }: AddColumnModalProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')
  const [type, setType] = useState('text')
  const [isRequired, setIsRequired] = useState(false)
  const [options, setOptions] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const needsOptions = type === 'select' || type === 'multiselect'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !label.trim()) {
      setError('フィールド名とラベルは必須です')
      return
    }

    if (existingColumns.some(col => col.name === name)) {
      setError('このフィールド名は既に使用されています')
      return
    }

    if (needsOptions && !options.trim()) {
      setError('選択肢を入力してください')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_id: tableId,
          name: name.trim(),
          label: label.trim(),
          type,
          is_required: isRequired,
          options: needsOptions ? options.split('\n').filter(o => o.trim()) : null,
          display_order: existingColumns.length + 1,
        }),
      })

      if (!response.ok) throw new Error('Failed to create column')

      router.refresh()
      onClose()
    } catch (err) {
      setError('列の作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[10px] flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-[12px_12px_20px_-2px_rgba(0,0,0,0.09),6px_6px_10px_-2px_rgba(0,0,0,0.32),3px_3px_5px_-1px_rgba(0,0,0,0.41)]">
        <div className="border-b border-[#E4E4E7] px-8 py-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#09090B]">列を追加</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#F4F4F5] rounded-xl transition-colors">
            <X className="w-6 h-6 text-[#71717B]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div>
            <label className="block text-base font-bold text-[#09090B] mb-3">
              フィールド名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
              placeholder="例: company_name"
              className="w-full px-5 py-4 text-base border border-[#E4E4E7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#09090B] focus:border-[#09090B] transition-all"
            />
            <p className="text-sm text-[#71717B] mt-2">
              英数字とアンダースコアのみ使用可能
            </p>
          </div>

          <div>
            <label className="block text-base font-bold text-[#09090B] mb-3">
              表示ラベル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例: 会社名"
              className="w-full px-5 py-4 text-base border border-[#E4E4E7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#09090B] focus:border-[#09090B] transition-all"
            />
          </div>

          <div>
            <label className="block text-base font-bold text-[#09090B] mb-3">
              フィールドタイプ
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-5 py-4 text-base border border-[#E4E4E7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#09090B] focus:border-[#09090B] transition-all"
            >
              {FIELD_TYPES.map((ft) => (
                <option key={ft.value} value={ft.value}>
                  {ft.label}
                </option>
              ))}
            </select>
          </div>

          {needsOptions && (
            <div>
              <label className="block text-base font-bold text-[#09090B] mb-3">
                選択肢（1行に1つ）
              </label>
              <textarea
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder="選択肢1&#10;選択肢2&#10;選択肢3"
                rows={5}
                className="w-full px-5 py-4 text-base border border-[#E4E4E7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#09090B] focus:border-[#09090B] transition-all leading-[1.6]"
              />
            </div>
          )}

          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="w-5 h-5 rounded border-[#E4E4E7] text-[#09090B] focus:ring-[#09090B]"
              />
              <span className="text-base text-[#09090B] font-medium">必須フィールド</span>
            </label>
          </div>

          {error && (
            <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-base text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border border-[#E4E4E7] rounded-xl text-base font-semibold hover:bg-[#F4F4F5] transition-colors"
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-4 bg-[#09090B] text-white rounded-xl text-base font-bold hover:bg-[#27272A] disabled:opacity-50 transition-colors shadow-[0px_4px_20px_rgba(0,0,0,0.15)]"
            >
              {loading ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
