import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardContent from '@/components/dashboard/DashboardContent'

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

  return (
    <DashboardContent
      tables={tables || []}
      organizationId={orgId}
    />
  )
}
