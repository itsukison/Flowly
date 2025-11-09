import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats, getRecentActivity } from '@/lib/services/customerService'
import { Plus, TrendingUp, Users, MessageSquare, Activity } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's organization
  const { data: userProfile } = await supabase
    .from('users')
    .select('organization_id, organizations(*)')
    .eq('id', user.id)
    .single()

  if (!userProfile?.organization_id) {
    // User doesn't have an organization yet - redirect to onboarding
    redirect('/onboarding')
  }

  const stats = await getDashboardStats(userProfile.organization_id)
  const recentActivity = await getRecentActivity(userProfile.organization_id, 10)

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#09090B] mb-2">
            ダッシュボード
          </h1>
          <p className="text-[#71717B]">
            おかえりなさい、{userProfile.organizations?.name || user.email}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#71717B]">総顧客数</h3>
              <Users className="w-5 h-5 text-[#71717B]" />
            </div>
            <p className="text-3xl font-bold text-[#09090B] mb-2">
              {stats.totalCustomers}
            </p>
            <p className="text-sm text-[#71717B]">
              {stats.newThisWeek > 0 && (
                <span className="text-[#0CB300] flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  今週 +{stats.newThisWeek}
                </span>
              )}
              {stats.newThisWeek === 0 && '今週の新規なし'}
            </p>
          </div>

          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#71717B]">今週の新規</h3>
              <TrendingUp className="w-5 h-5 text-[#71717B]" />
            </div>
            <p className="text-3xl font-bold text-[#09090B] mb-2">
              {stats.newThisWeek}
            </p>
            <p className="text-sm text-[#71717B]">過去7日間</p>
          </div>

          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#71717B]">商談中</h3>
              <MessageSquare className="w-5 h-5 text-[#71717B]" />
            </div>
            <p className="text-3xl font-bold text-[#09090B] mb-2">
              {stats.inNegotiation}
            </p>
            <p className="text-sm text-[#71717B]">要フォローアップ</p>
          </div>

          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#71717B]">今週の活動</h3>
              <Activity className="w-5 h-5 text-[#71717B]" />
            </div>
            <p className="text-3xl font-bold text-[#09090B] mb-2">
              {stats.activityThisWeek}
            </p>
            <p className="text-sm text-[#71717B]">アクション数</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#09090B] mb-4">クイックアクション</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/customers?action=add"
              className="flex items-center gap-4 bg-white border border-[#E4E4E7] rounded-2xl p-6 hover:border-[#09090B] transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-[#09090B] flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[#09090B]">顧客を追加</h3>
                <p className="text-sm text-[#71717B]">新しい顧客を登録</p>
              </div>
            </Link>

            <Link
              href="/dashboard/import"
              className="flex items-center gap-4 bg-white border border-[#E4E4E7] rounded-2xl p-6 hover:border-[#09090B] transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-[#F4F4F5] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#09090B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-[#09090B]">データをインポート</h3>
                <p className="text-sm text-[#71717B]">Excel/CSVから一括登録</p>
              </div>
            </Link>

            <Link
              href="/dashboard/customers?filter=missing_data"
              className="flex items-center gap-4 bg-white border border-[#E4E4E7] rounded-2xl p-6 hover:border-[#09090B] transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-[#F4F4F5] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#09090B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-[#09090B]">データを充実</h3>
                <p className="text-sm text-[#71717B]">不足情報を補完</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Status Breakdown */}
        {stats.statusBreakdown.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#09090B] mb-4">ステータス別内訳</h2>
            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6">
              <div className="space-y-4">
                {stats.statusBreakdown.map((item) => (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#09090B]">{item.status}</span>
                      <span className="text-sm text-[#71717B]">{item.count}件</span>
                    </div>
                    <div className="w-full bg-[#F4F4F5] rounded-full h-2">
                      <div
                        className="bg-[#09090B] h-2 rounded-full transition-all"
                        style={{ width: `${(item.count / stats.totalCustomers) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentActivity && recentActivity.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-[#09090B] mb-4">最近の活動</h2>
            <div className="bg-white border border-[#E4E4E7] rounded-2xl overflow-hidden">
              <div className="divide-y divide-[#E4E4E7]">
                {recentActivity.map((activity: any) => (
                  <div key={activity.id} className="p-4 hover:bg-[#FAFAFA] transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#F4F4F5] flex items-center justify-center flex-shrink-0">
                        <Activity className="w-4 h-4 text-[#09090B]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#09090B]">
                          <span className="font-medium">{activity.user?.full_name || activity.user?.email || 'システム'}</span>
                          {' '}が{' '}
                          <span className="font-medium">{activity.customer?.name}</span>
                          {' '}を
                          {activity.action_type === 'created' && '作成しました'}
                          {activity.action_type === 'updated' && '更新しました'}
                          {activity.action_type === 'status_changed' && 'ステータスを変更しました'}
                          {activity.action_type === 'enriched' && 'データを充実させました'}
                          {activity.action_type === 'merged' && 'マージしました'}
                          {activity.action_type === 'note_added' && 'メモを追加しました'}
                        </p>
                        <p className="text-xs text-[#71717B] mt-1">
                          {new Date(activity.created_at).toLocaleString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats.totalCustomers === 0 && (
          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-12 text-center">
            <Users className="w-16 h-16 text-[#E4E4E7] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#09090B] mb-2">
              まだ顧客がいません
            </h3>
            <p className="text-[#71717B] mb-6">
              最初の顧客を追加して、CRMの使用を開始しましょう
            </p>
            <Link
              href="/dashboard/customers?action=add"
              className="inline-flex items-center gap-2 bg-[#09090B] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#27272A] transition-colors"
            >
              <Plus className="w-5 h-5" />
              顧客を追加
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}