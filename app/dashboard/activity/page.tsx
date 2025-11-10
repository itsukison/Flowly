import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ActivityLog from '@/components/activity/ActivityLog'

export default async function ActivityPage() {
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

  // Get activity logs
  const { data: activities } = await supabase
    .from('customer_activity_log')
    .select(`
      *,
      customer:customers(name),
      user:users(full_name, email)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(100)

  // Get users for filter
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('current_organization_id', orgId)

  // Get tables for filter
  const { data: tables } = await supabase
    .from('tables')
    .select('id, name')
    .eq('organization_id', orgId)

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#09090B] mb-2">
            活動ログ
          </h1>
          <p className="text-[#71717B]">
            すべての活動履歴を確認
          </p>
        </div>

        <ActivityLog
          activities={activities || []}
          users={users || []}
          tables={tables || []}
        />
      </div>
    </div>
  )
}
