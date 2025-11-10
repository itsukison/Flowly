import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('current_organization_id')
    .eq('id', user.id)
    .single()

  if (!userProfile?.current_organization_id) {
    redirect('/dashboard')
  }

  const orgId = userProfile.current_organization_id

  // Get all customers
  const { data: customers } = await supabase
    .from('customers')
    .select('*, table:tables(name)')
    .eq('organization_id', orgId)

  // Get all tables
  const { data: tables } = await supabase
    .from('tables')
    .select('id, name, icon')
    .eq('organization_id', orgId)

  // Get activity count by date (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: activities } = await supabase
    .from('customer_activity_log')
    .select('created_at, action_type')
    .eq('organization_id', orgId)
    .gte('created_at', thirtyDaysAgo.toISOString())

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#09090B] mb-2">
            分析
          </h1>
          <p className="text-[#71717B]">
            データの傾向と統計を確認
          </p>
        </div>

        <AnalyticsDashboard
          customers={customers || []}
          tables={tables || []}
          activities={activities || []}
        />
      </div>
    </div>
  )
}
