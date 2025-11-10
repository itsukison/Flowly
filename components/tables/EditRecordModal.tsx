'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import DynamicFieldRenderer from './DynamicFieldRenderer'

export default function EditRecordModal({ record, columns, statuses, tableId, onClose }: any) {
  const router = useRouter()
  const [formData, setFormData] = useState(() => {
    const data: any = { status: record.status }
    columns.forEach((col: any) => {
      data[col.name] = record[col.name] || record.custom_fields?.[col.name] || ''
    })
    return data
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const standardFields = ['name', 'email', 'phone', 'company_name', 'company_domain', 'address', 'industry', 'employee_count', 'name_furigana']
      const customerData: any = { status: formData.status }
      const customFields: any = {}

      columns.forEach((col: any) => {
        if (standardFields.includes(col.name)) {
          customerData[col.name] = formData[col.name] || null
        } else {
          customFields[col.name] = formData[col.name] || null
        }
      })

      customerData.custom_fields = customFields

      const response = await fetch(`/api/customers/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      })

      if (!response.ok) throw new Error('Failed to update record')

      router.refresh()
      onClose()
    } catch (err) {
      setError('レコードの更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-[#09090B]">レコードを編集</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#F4F4F5] rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {columns.map((column: any) => (
            <div key={column.id}>
              <label className="block text-sm font-medium text-[#09090B] mb-2">
                {column.label}
                {column.is_required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <DynamicFieldRenderer
                column={column}
                value={formData[column.name]}
                onChange={(value) => setFormData({ ...formData, [column.name]: value })}
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-[#09090B] mb-2">ステータス</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#09090B]"
            >
              {statuses.map((status: any) => (
                <option key={status.id} value={status.name}>{status.name}</option>
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
              {loading ? '更新中...' : '更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
