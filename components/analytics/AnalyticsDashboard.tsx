'use client'

import { useMemo } from 'react'
import { TrendingUp, Users, Activity, Database } from 'lucide-react'

export default function AnalyticsDashboard({ customers, tables, activities }: any) {
  const stats = useMemo(() => {
    // Status breakdown
    const statusBreakdown: Record<string, number> = {}
    customers.forEach((c: any) => {
      statusBreakdown[c.status] = (statusBreakdown[c.status] || 0) + 1
    })

    // Table breakdown
    const tableBreakdown: Record<string, number> = {}
    customers.forEach((c: any) => {
      const tableName = c.table?.name || 'Unknown'
      tableBreakdown[tableName] = (tableBreakdown[tableName] || 0) + 1
    })

    // Activity by day (last 7 days)
    const activityByDay: Record<string, number> = {}
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    last7Days.forEach(day => {
      activityByDay[day] = 0
    })

    activities.forEach((a: any) => {
      const day = a.created_at.split('T')[0]
      if (activityByDay[day] !== undefined) {
        activityByDay[day]++
      }
    })

    // Growth calculation
    const thisWeek = customers.filter((c: any) => {
      const created = new Date(c.created_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return created >= weekAgo
    }).length

    const lastWeek = customers.filter((c: any) => {
      const created = new Date(c.created_at)
      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return created >= twoWeeksAgo && created < weekAgo
    }).length

    const growthRate = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek * 100).toFixed(1) : '0'

    return {
      statusBreakdown,
      tableBreakdown,
      activityByDay,
      growthRate,
      thisWeek,
    }
  }, [customers, activities])

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_4px_20px_rgba(0,0,0,0.15)] transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#71717B]">総レコード数</h3>
            <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center">
              <Database className="w-5 h-5 text-[#71717B]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#09090B]">{customers.length}</p>
        </div>

        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_4px_20px_rgba(0,0,0,0.15)] transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#71717B]">今週の新規</h3>
            <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#71717B]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#09090B]">{stats.thisWeek}</p>
          <p className="text-sm text-green-600 mt-2 font-medium">+{stats.growthRate}% 先週比</p>
        </div>

        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_4px_20px_rgba(0,0,0,0.15)] transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#71717B]">テーブル数</h3>
            <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center">
              <Users className="w-5 h-5 text-[#71717B]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#09090B]">{tables.length}</p>
        </div>

        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_4px_20px_rgba(0,0,0,0.15)] transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#71717B]">今週の活動</h3>
            <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#71717B]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#09090B]">{activities.length}</p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <h2 className="text-xl font-bold text-[#09090B] mb-6">ステータス別内訳</h2>
        <div className="space-y-4">
          {Object.entries(stats.statusBreakdown).map(([status, count]) => (
            <div key={status}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#09090B]">{status}</span>
                <span className="text-sm text-[#71717B]">{count}件</span>
              </div>
              <div className="w-full bg-[#F4F4F5] rounded-full h-2">
                <div
                  className="bg-[#09090B] h-2 rounded-full transition-all"
                  style={{ width: `${(count / customers.length) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table Breakdown */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <h2 className="text-xl font-bold text-[#09090B] mb-6">テーブル別内訳</h2>
        <div className="space-y-4">
          {Object.entries(stats.tableBreakdown).map(([table, count]) => (
            <div key={table} className="flex items-center justify-between py-2 border-b border-[#E4E4E7] last:border-0">
              <span className="text-sm font-semibold text-[#09090B]">{table}</span>
              <span className="text-2xl font-bold text-[#09090B]">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <h2 className="text-xl font-bold text-[#09090B] mb-6">活動推移（過去7日間）</h2>
        <div className="flex items-end justify-between gap-2 h-48">
          {Object.entries(stats.activityByDay).map(([day, count]) => {
            const maxCount = Math.max(...Object.values(stats.activityByDay))
            const height = maxCount > 0 ? (count / maxCount) * 100 : 0
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-[#09090B] rounded-t transition-all hover:opacity-80" style={{ height: `${height}%`, minHeight: '4px' }} />
                <span className="text-xs text-[#71717B]">
                  {new Date(day).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                </span>
                <span className="text-xs font-bold text-[#09090B]">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
