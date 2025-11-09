'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { LogOut, User as UserIcon } from 'lucide-react'

interface DashboardHeaderProps {
  user: User
  userProfile: any
}

export default function DashboardHeader({ user, userProfile }: DashboardHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-[10px] border-b border-[#E4E4E7] z-50">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-[#09090B]">Flowly</h1>
          {userProfile?.organizations && (
            <span className="text-sm text-[#71717B] hidden md:inline">
              {userProfile.organizations.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-4 py-2 rounded-full hover:bg-[#F4F4F5] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#09090B] flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-[#09090B] hidden md:inline">
                {userProfile?.full_name || user.email}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-[#E4E4E7] shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E4E4E7]">
                  <p className="text-sm font-medium text-[#09090B]">
                    {userProfile?.full_name || 'ユーザー'}
                  </p>
                  <p className="text-xs text-[#71717B] mt-1">{user.email}</p>
                  {userProfile?.role && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-[#F4F4F5] text-[#09090B] rounded">
                      {userProfile.role === 'owner' ? 'オーナー' : userProfile.role === 'admin' ? '管理者' : 'メンバー'}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#71717B] hover:bg-[#F4F4F5] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  ログアウト
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
