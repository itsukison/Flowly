import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingForm from '@/components/onboarding/OnboardingForm'
import Header from '@/components/Header'

export default async function OnboardingPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user already has an organization
  // This uses the "users_select_own_profile" RLS policy which allows viewing own profile
  const { data: userProfile, error } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  // If there's an error, log it but don't block (user might not exist in users table yet)
  if (error) {
    console.error('Error checking user organization:', error)
  }

  if (userProfile?.organization_id) {
    // Already has organization, go to dashboard
    redirect('/dashboard')
  }

  return (
    <>
    <Header />
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#09090B] mb-2">
            組織を作成
          </h1>
          <p className="text-[#71717B]">
            まず、あなたの組織名を入力してください
          </p>
        </div>

        <OnboardingForm userId={user.id} />
      </div>
    </div>
    </>
  )
}
