'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X, AlertCircle } from 'lucide-react'

interface AddCustomerModalProps {
  users: any[]
  currentUserId: string
  organizationId: string
  onClose: () => void
}

export default function AddCustomerModal({
  users,
  currentUserId,
  organizationId,
  onClose,
}: AddCustomerModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [duplicateWarning, setDuplicateWarning] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: '',
    name_furigana: '',
    email: '',
    phone: '',
    company_name: '',
    address: '',
    industry: '',
    employee_count: '',
    status: 'リード',
    assigned_to: currentUserId,
    notes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const checkDuplicates = async () => {
    if (!formData.name) return

    try {
      // Check for similar names
      const { data } = await supabase
        .rpc('find_similar_customers', {
          org_id: organizationId,
          customer_name: formData.name,
          threshold: 0.7,
        })

      if (data && data.length > 0) {
        setDuplicateWarning(data)
      }

      // Check for exact email match
      if (formData.email) {
        const { data: emailMatch } = await supabase
          .from('customers')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('email', formData.email)
          .limit(1)

        if (emailMatch && emailMatch.length > 0) {
          setDuplicateWarning(prev => [...prev, ...emailMatch])
        }
      }
    } catch (err) {
      console.error('Error checking duplicates:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Extract domain from email
      let companyDomain = ''
      if (formData.email) {
        const emailParts = formData.email.split('@')
        if (emailParts.length === 2) {
          companyDomain = emailParts[1]
        }
      }

      const { data: customer, error: insertError } = await supabase
        .from('customers')
        .insert({
          organization_id: organizationId,
          name: formData.name,
          name_furigana: formData.name_furigana || null,
          email: formData.email || null,
          phone: formData.phone || null,
          company_name: formData.company_name || null,
          company_domain: companyDomain || null,
          address: formData.address || null,
          industry: formData.industry || null,
          employee_count: formData.employee_count ? parseInt(formData.employee_count) : null,
          status: formData.status,
          assigned_to: formData.assigned_to || null,
          created_by: currentUserId,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Log activity
      await supabase.from('customer_activity_log').insert({
        customer_id: customer.id,
        organization_id: organizationId,
        user_id: currentUserId,
        action_type: 'created',
        notes: formData.notes || null,
        changes: { customer },
      })

      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message || '顧客の作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#09090B]">顧客を追加</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F4F4F5] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {duplicateWarning.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-700" />
                <span className="text-sm font-semibold text-yellow-700">
                  似た顧客が見つかりました
                </span>
              </div>
              <div className="space-y-2">
                {duplicateWarning.slice(0, 3).map((dup) => (
                  <div key={dup.id} className="text-sm text-yellow-700">
                    {dup.name} {dup.email && `(${dup.email})`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Required Fields */}
          <div>
            <label className="block text-sm font-medium text-[#09090B] mb-2">
              名前 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={checkDuplicates}
              required
              className="w-full px-4 py-3 border border-[#E4E4E7] rounded-xl focus:outline-none focus:border-[#09090B] transition-colors"
              placeholder="山田太郎"
            />
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#09090B] mb-2">
                フリガナ
              </label>
              <input
                type="text"
                name="name_furigana"
                value={formData.name_furigana}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#E4E4E7] rounded-xl focus:outline-none focus:border-[#09090B] transition-colors"
                placeholder="やまだたろう"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#09090B] mb-2">
                メール
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#E4E4E7] rounded-xl focus:outline-none focus:border-[#09090B] transition-colors"
                placeholder="yamada@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#09090B] mb-2">
                電話
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#E4E4E7] rounded-xl focus:outline-none focus:border-[#09090B] transition-colors"
                placeholder="03-1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#09090B] mb-2">
                会社名
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#E4E4E7] rounded-xl focus:outline-none focus:border-[#09090B] transition-colors"
                placeholder="株式会社サンプル"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#09090B] mb-2">
                業種
              </label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#E4E4E7] rounded-xl focus:outline-none focus:border-[#09090B] transition-colors"
                placeholder="IT・ソフトウェア"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#09090B] mb-2">
                従業員数
              </label>
              <input
                type="number"
                name="employee_count"
                value={formData.employee_count}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#E4E4E7] rounded-xl focus:outline-none focus:border-[#09090B] transition-colors"
                placeholder="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#09090B] mb-2">
                ステータス
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#E4E4E7] rounded-xl focus:outline-none focus:border-[#09090B] transition-colors"
              >
                <option value="リード">リード</option>
                <option value="商談中">商談中</option>
                <option value="契約">契約</option>
                <option value="運用中">運用中</option>
                <option value="休眠">休眠</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#09090B] mb-2">
                担当者
              </label>
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#E4E4E7] rounded-xl focus:outline-none focus:border-[#09090B] transition-colors"
              >
                <option value="">未割当</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#09090B] mb-2">
              住所
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-3 border border-[#E4E4E7] rounded-xl focus:outline-none focus:border-[#09090B] transition-colors resize-none"
              placeholder="東京都渋谷区..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#09090B] mb-2">
              メモ
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-[#E4E4E7] rounded-xl focus:outline-none focus:border-[#09090B] transition-colors resize-none"
              placeholder="初回の連絡内容など..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-[#E4E4E7] rounded-xl font-semibold hover:bg-[#F4F4F5] transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="flex-1 px-6 py-3 bg-[#09090B] text-white rounded-xl font-semibold hover:bg-[#27272A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '作成中...' : '顧客を作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
