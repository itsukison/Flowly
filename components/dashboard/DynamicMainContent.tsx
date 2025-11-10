'use client'

import { useSidebar } from '@/contexts/SidebarContext'

export default function DynamicMainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <main 
      className={`
        flex-1 pt-16 transition-all duration-300 ease-in-out
        ml-0 ${isCollapsed ? 'md:ml-16' : 'md:ml-64'}
      `}
    >
      {children}
    </main>
  )
}
