'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getIconComponent } from '@/lib/iconMapping'
import { useEffect } from 'react'

interface TableLayoutClientProps {
  table: any
  children: React.ReactNode
}

export default function TableLayoutClient({ table, children }: TableLayoutClientProps) {
  const pathname = usePathname()
  const TableIcon = getIconComponent(table.icon)
  
  // Check if we're on the main table page (overview)
  const isOverviewPage = pathname === `/dashboard/tables/${table.id}`

  // Set data attributes for sidebar
  useEffect(() => {
    document.body.setAttribute('data-table-name', table.name)
    document.body.setAttribute('data-table-icon', table.icon)
    
    return () => {
      document.body.removeAttribute('data-table-name')
      document.body.removeAttribute('data-table-icon')
    }
  }, [table.name, table.icon])

  return (
    <div className="px-6 py-8">
      {isOverviewPage && (
        <>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-[#71717B] hover:text-[#09090B] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            ダッシュボードに戻る
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-[#F4F4F5] flex items-center justify-center flex-shrink-0">
              <TableIcon className="w-7 h-7 text-[#09090B]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#09090B]">{table.name}</h1>
              {table.description && (
                <p className="text-[#71717B] mt-1">{table.description}</p>
              )}
            </div>
          </div>
        </>
      )}

      {children}
    </div>
  )
}
