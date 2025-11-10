'use client'

import { useState } from 'react'
import { Activity, Filter } from 'lucide-react'

export default function ActivityLog({ activities, users, tables }: any) {
  const [filterUser, setFilterUser] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredActivities = activities.filter((activity: any) => {
    if (filterUser && activity.user_id !== filterUser) return false
    if (filterAction && activity.action_type !== filterAction) return false
    if (searchQuery && !activity.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const actionTypeLabels: Record<string, string> = {
    created: '作成',
    updated: '更新',
    status_changed: 'ステータス変更',
    enriched: 'エンリッチ',
    merged: 'マージ',
    note_added: 'メモ追加',
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-[#71717B]" />
          <h2 className="text-lg font-bold text-[#09090B]">フィルター</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#09090B] mb-2">
              ユーザー
            </label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#09090B] focus:border-[#09090B] transition-all"
            >
              <option value="">すべて</option>
              {users.map((user: any) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#09090B] mb-2">
              アクション
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#09090B] focus:border-[#09090B] transition-all"
            >
              <option value="">すべて</option>
              {Object.entries(actionTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#09090B] mb-2">
              検索
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="顧客名で検索"
              className="w-full px-4 py-2 text-sm border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#09090B] focus:border-[#09090B] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl overflow-hidden shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <div className="divide-y divide-[#E4E4E7]">
          {filteredActivities.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#F4F4F5] flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-[#71717B]" />
              </div>
              <p className="text-sm text-[#71717B]">活動履歴がありません</p>
            </div>
          ) : (
            filteredActivities.map((activity: any) => (
              <div key={activity.id} className="p-4 hover:bg-[#FAFAFA] transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5 text-[#09090B]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#09090B]">
                      <span className="font-semibold">
                        {activity.user?.full_name || activity.user?.email || 'システム'}
                      </span>
                      {' '}が{' '}
                      <span className="font-semibold">{activity.customer?.name || '不明'}</span>
                      {' '}を
                      {actionTypeLabels[activity.action_type] || activity.action_type}
                      しました
                    </p>
                    {activity.notes && (
                      <p className="text-sm text-[#71717B] mt-1">{activity.notes}</p>
                    )}
                    <p className="text-xs text-[#71717B] mt-1">
                      {new Date(activity.created_at).toLocaleString('ja-JP')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {filteredActivities.length > 0 && (
        <p className="text-sm text-[#71717B] text-center">
          {filteredActivities.length}件の活動を表示中
        </p>
      )}
    </div>
  )
}
