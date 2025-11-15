import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ImportWizard from '@/components/import/wizard/ImportWizard'

export default async function ImportPage() {
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
    redirect('/dashboard')
  }

  const orgId = userProfile.current_organization_id

  // Get all tables for this organization
  const { data: tables } = await supabase
    .from('tables')
    .select('id, name, icon, description')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  // Get all users for assignment dropdown
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('current_organization_id', orgId)

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#09090B] mb-2">
            データインポート
          </h1>
          <p className="text-[#71717B]">
            Excel/CSVファイルから一括登録
          </p>
        </div>

        <ImportWizard
          organizationId={orgId}
          userId={user.id}
          tables={tables || []}
          users={users || []}
        />
      </div>
    </div>
  )
}
