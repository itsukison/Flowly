'use client'

import EnhancedColumnManager from './EnhancedColumnManager'

interface Column {
  id: string
  name: string
  label: string
  type: string
  options: any
  is_required: boolean | null
  display_order: number
}

interface ColumnManagerWrapperProps {
  tableId: string
  columns: Column[]
}

export default function ColumnManagerWrapper({ tableId, columns }: ColumnManagerWrapperProps) {
  return (
    <EnhancedColumnManager
      tableId={tableId}
      columns={columns}
      visibleColumns={columns.map((col) => col.id)}
      onVisibilityChange={() => {}}
      onClose={() => {}}
    />
  )
}
