'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Customer } from '@/lib/supabase/types'
import { Search, Filter, MoreVertical, Mail, Phone, User } from 'lucide-react'
import CustomerStatusBadge from './CustomerStatusBadge'
import AddCustomerModal from './AddCustomerModal'

interface CustomerListProps {
  customers: any[]
  users: any[]
  total: number
  page: number
  totalPages: number
  currentUserId: string
  organizationId: string
}

export default function CustomerList({
  customers,
  users,
  total,
  page,
  totalPages,
  currentUserId,
  organizationId,
}: CustomerListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchQuery) {
      params.set('search', searchQuery)
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    router.push(`/dashboard/customers?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`/dashboard/customers?${params.toString()}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '今日'
    if (diffDays === 1) return '昨日'
    if (diffDays < 7) return `${diffDays}日前`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`
    return `${Math.floor(diffDays / 365)}年前`
  }

  return (
    <>
      {/* Search and Filters */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#71717B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="名前、メール、電話番号、会社名で検索..."
                className="w-full pl-12 pr-4 py-3 border border-[#E4E4E7] rounded-xl focus:outline-none focus:border-[#09090B] transition-colors"
              />
            </div>
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-[#E4E4E7] rounded-xl hover:bg-[#F4F4F5] transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span className="hidden md:inline">フィルター</span>
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-[#E4E4E7]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#09090B] mb-2">
                  ステータス
                </label>
                <select className="w-full px-4 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:border-[#09090B]">
                  <option value="">すべて</option>
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
                <select className="w-full px-4 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:border-[#09090B]">
                  <option value="">すべて</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#09090B] mb-2">
                  データ不足
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-[#71717B]">メールなし</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-[#71717B]">電話なし</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Table (Desktop) */}
      <div className="hidden md:block bg-white border border-[#E4E4E7] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#09090B]">
                  名前
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#09090B]">
                  会社名
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#09090B]">
                  連絡先
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#09090B]">
                  ステータス
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#09090B]">
                  担当者
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#09090B]">
                  最終連絡
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-[#09090B]">
                  アクション
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7]">
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-[#09090B]">{customer.name}</div>
                    {customer.name_furigana && (
                      <div className="text-xs text-[#71717B]">{customer.name_furigana}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#71717B]">
                    {customer.company_name || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {customer.email && (
                        <div className="flex items-center gap-2 text-sm text-[#71717B]">
                          <Mail className="w-4 h-4" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-sm text-[#71717B]">
                          <Phone className="w-4 h-4" />
                          {customer.phone}
                        </div>
                      )}
                      {!customer.email && !customer.phone && '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <CustomerStatusBadge status={customer.status} />
                  </td>
                  <td className="px-6 py-4">
                    {customer.assigned_user ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#F4F4F5] flex items-center justify-center">
                          <User className="w-4 h-4 text-[#09090B]" />
                        </div>
                        <span className="text-sm text-[#71717B]">
                          {customer.assigned_user.full_name || customer.assigned_user.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-[#A1A1AA]">未割当</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#71717B]">
                    {customer.last_contact_date
                      ? formatDate(customer.last_contact_date)
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Show action menu
                      }}
                      className="p-2 hover:bg-[#F4F4F5] rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-[#71717B]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {customers.length === 0 && (
          <div className="py-12 text-center">
            <User className="w-16 h-16 text-[#E4E4E7] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#09090B] mb-2">
              顧客が見つかりません
            </h3>
            <p className="text-[#71717B] mb-6">
              {searchQuery ? '検索条件を変更してください' : '最初の顧客を追加しましょう'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 bg-[#09090B] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#27272A] transition-colors"
              >
                顧客を追加
              </button>
            )}
          </div>
        )}
      </div>

      {/* Customer Cards (Mobile) */}
      <div className="md:hidden space-y-4">
        {customers.map((customer) => (
          <div
            key={customer.id}
            onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
            className="bg-white border border-[#E4E4E7] rounded-2xl p-4 cursor-pointer hover:border-[#09090B] transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-[#09090B] mb-1">{customer.name}</h3>
                {customer.company_name && (
                  <p className="text-sm text-[#71717B]">{customer.company_name}</p>
                )}
              </div>
              <CustomerStatusBadge status={customer.status} />
            </div>

            <div className="space-y-2 mb-3">
              {customer.email && (
                <div className="flex items-center gap-2 text-sm text-[#71717B]">
                  <Mail className="w-4 h-4" />
                  {customer.email}
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm text-[#71717B]">
                  <Phone className="w-4 h-4" />
                  {customer.phone}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E4E4E7]">
              <div className="text-xs text-[#71717B]">
                {customer.assigned_user
                  ? customer.assigned_user.full_name || customer.assigned_user.email
                  : '未割当'}
              </div>
              <div className="text-xs text-[#71717B]">
                {customer.last_contact_date
                  ? formatDate(customer.last_contact_date)
                  : '連絡なし'}
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {customers.length === 0 && (
          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-12 text-center">
            <User className="w-16 h-16 text-[#E4E4E7] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#09090B] mb-2">
              顧客が見つかりません
            </h3>
            <p className="text-[#71717B] mb-6">
              {searchQuery ? '検索条件を変更してください' : '最初の顧客を追加しましょう'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 bg-[#09090B] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#27272A] transition-colors"
              >
                顧客を追加
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-[#71717B]">
            {total}件中 {(page - 1) * 20 + 1}-{Math.min(page * 20, total)}件を表示
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              前へ
            </button>
            <span className="px-4 py-2 text-sm text-[#71717B]">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <AddCustomerModal
          users={users}
          currentUserId={currentUserId}
          organizationId={organizationId}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  )
}
