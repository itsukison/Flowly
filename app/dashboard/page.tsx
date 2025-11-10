import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Database, TrendingUp, FolderKanban, Activity } from 'lucide-react'
import TableList from '@/components/dashboard/TableList'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's current organization
  const { data: userProfile } = await supabase
    .from('users')
    .select('current_organization_id')
    .eq('id', user.id)
    .single()

  if (!userProfile?.current_organization_id) {
    redirect('/onboarding')
  }

  const orgId = userProfile.current_organization_id

  // Get tables for this organization
  const { data: tables } = await supabase
    .from('tables')
    .select('id, name, icon, description, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  // Get total records across all tables
  const { count: totalRecords } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  // Get new records this week
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  const { count: newThisWeek } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('created_at', oneWeekAgo.toISOString())

  // Get activity count this week
  const { count: activityThisWeek } = await supabase
    .from('customer_activity_log')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('created_at', oneWeekAgo.toISOString())

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#09090B] mb-2">
            ダッシュボード
          </h1>
          <p className="text-sm text-[#71717B]">
            データベースとレコードの概要
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_4px_20px_rgba(0,0,0,0.15)] transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#71717B]">総レコード数</h3>
              <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center">
                <Database className="w-5 h-5 text-[#71717B]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#09090B] mb-1">
              {totalRecords || 0}
            </p>
            <p className="text-xs text-[#71717B]">全テーブル合計</p>
          </div>

          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_4px_20px_rgba(0,0,0,0.15)] transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#71717B]">今週の新規</h3>
              <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#71717B]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#09090B] mb-1">
              {newThisWeek || 0}
            </p>
            <p className="text-xs text-[#71717B]">過去7日間</p>
          </div>

          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_4px_20px_rgba(0,0,0,0.15)] transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#71717B]">アクティブテーブル</h3>
              <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-[#71717B]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#09090B] mb-1">
              {tables?.length || 0}
            </p>
            <p className="text-xs text-[#71717B]">作成済み</p>
          </div>

          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_4px_20px_rgba(0,0,0,0.15)] transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#71717B]">今週の活動</h3>
              <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#71717B]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#09090B] mb-1">
              {activityThisWeek || 0}
            </p>
            <p className="text-xs text-[#71717B]">アクション数</p>
          </div>
        </div>

        {/* Table List */}
        <TableList tables={tables || []} organizationId={orgId} />
      </div>
    </div>
  )
}
