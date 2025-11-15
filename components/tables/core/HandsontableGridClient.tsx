'use client'

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

interface Column {
  id: string
  name: string
  label: string
  type: string
  options: any
  is_required: boolean | null
  display_order: number
}

interface Status {
  id: string
  name: string
  color: string | null
  display_order: number
}

interface TableRecord {
  id: string
  name?: string
  email?: string
  company?: string
  status?: string
  data: Record<string, any>
  [key: string]: any
}

interface HandsontableGridProps {
  columns: Column[]
  statuses: Status[]
  records: TableRecord[]
  tableId: string
  onSelectionChange?: (selectedIds: string[]) => void
}

// Loading component
function LoadingGrid() {
  return (
    <div className="bg-white border border-[#E4E4E7] rounded-xl overflow-hidden relative flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-8 w-8 text-[#09090B]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm text-[#71717B]">読み込み中...</p>
      </div>
    </div>
  )
}

// Dynamically import HandsontableGrid with no SSR
const HandsontableGrid = dynamic<HandsontableGridProps>(
  () => import('./HandsontableGrid'),
  { 
    ssr: false,
    loading: () => <LoadingGrid />
  }
)

export default HandsontableGrid
