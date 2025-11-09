import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ImportWizard from '@/components/import/ImportWizard'

export default async function ImportPage() {
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
    redirect('/dashboard')
  }

  // Get all users for assignment dropdown
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('organization_id', userProfile.organization_id)

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#09090B] mb-2">
            データインポート
          </h1>
          <p className="text-[#71717B]">
            Excel/CSVファイルから顧客データを一括登録
          </p>
        </div>

        <ImportWizard
          organizationId={userProfile.organization_id}
          userId={user.id}
          users={users || []}
        />
      </div>
    </div>
  )
}
