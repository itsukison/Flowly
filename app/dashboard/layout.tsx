import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import DashboardHeader from '@/components/dashboard/Header'
import DynamicMainContent from '@/components/dashboard/DynamicMainContent'
import { SidebarProvider } from '@/contexts/SidebarContext'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile with organization
  const { data: userProfile } = await supabase
    .from('users')
    .select(`
      *,
      organization:organizations!current_organization_id(*)
    `)
    .eq('id', user.id)
    .single()

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#FAFAFA]">
        <DashboardHeader user={user} userProfile={userProfile} />
        <div className="flex">
          <DashboardSidebar />
          <DynamicMainContent>
            {children}
          </DynamicMainContent>
        </div>
      </div>
    </SidebarProvider>
  )
}
