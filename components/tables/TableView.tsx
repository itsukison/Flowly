'use client'

import { useState } from 'react'
import { Plus, Settings, Filter } from 'lucide-react'
import ColumnManager from './ColumnManager'
import DynamicTable from './DynamicTable'
import AddRecordModal from './AddRecordModal'

interface Column {
  id: string
  name: string
  label: string
  type: string
  options: any
  is_required: boolean
  display_order: number
}

interface Status {
  id: string
  name: string
  color: string
  display_order: number
}

interface Customer {
  id: string
  [key: string]: any
}

interface TableViewProps {
  table: any
  columns: Column[]
  statuses: Status[]
  initialCustomers: Customer[]
}

export default function TableView({ table, columns, statuses, initialCustomers }: TableViewProps) {
  const [showColumnManager, setShowColumnManager] = useState(false)
  const [showAddRecord, setShowAddRecord] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.map(col => col.id)
  )

  return (
    <div>
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors"
          >
            <Filter className="w-4 h-4" />
            フィルター
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowColumnManager(true)}
            className="flex items-center gap-2 px-4 py-2 border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors"
          >
            <Settings className="w-4 h-4" />
            列を管理
          </button>
          <button
            onClick={() => setShowAddRecord(true)}
            className="flex items-center gap-2 bg-[#09090B] text-white px-4 py-2 rounded-lg hover:bg-[#27272A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            レコードを追加
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#E4E4E7] rounded-lg p-4">
          <p className="text-sm text-[#71717B] mb-1">総レコード数</p>
          <p className="text-2xl font-bold text-[#09090B]">{initialCustomers.length}</p>
        </div>
        {statuses.slice(0, 3).map((status) => {
          const count = initialCustomers.filter(c => c.status === status.name).length
          return (
            <div key={status.id} className="bg-white border border-[#E4E4E7] rounded-lg p-4">
              <p className="text-sm text-[#71717B] mb-1">{status.name}</p>
              <p className="text-2xl font-bold text-[#09090B]">{count}</p>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <DynamicTable
        columns={columns.filter(col => visibleColumns.includes(col.id))}
        statuses={statuses}
        customers={initialCustomers}
        tableId={table.id}
      />

      {/* Modals */}
      {showColumnManager && (
        <ColumnManager
          tableId={table.id}
          columns={columns}
          visibleColumns={visibleColumns}
          onVisibilityChange={setVisibleColumns}
          onClose={() => setShowColumnManager(false)}
        />
      )}

      {showAddRecord && (
        <AddRecordModal
          tableId={table.id}
          columns={columns}
          statuses={statuses}
          organizationId={table.organization_id}
          onClose={() => setShowAddRecord(false)}
        />
      )}
    </div>
  )
}
