'use client'

import { useState } from 'react'
import { Plus, Maximize2, Target, TrendingUp, CheckCircle2, Users, Database } from 'lucide-react'
import CompactTableView from './CompactTableView'
import AddRecordModalWithImport from './AddRecordModalWithImport'
import Link from 'next/link'

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

interface Customer {
  id: string
  [key: string]: any
}

interface TableMainViewProps {
  table: any
  columns: Column[]
  statuses: Status[]
  customers: Customer[]
}

export default function TableMainView({ table, columns, statuses, customers }: TableMainViewProps) {
  const [showAddRecord, setShowAddRecord] = useState(false)

  const totalRecords = customers.length
  const statusStats = statuses.slice(0, 3).map((status) => ({
    name: status.name,
    count: customers.filter((c) => c.status === status.name).length,
  }))

  const getStatusIcon = (statusName: string) => {
    const lowerName = statusName.toLowerCase()
    if (lowerName.includes('リード') || lowerName.includes('lead')) return Target
    if (lowerName.includes('商談') || lowerName.includes('交渉') || lowerName.includes('negotiation'))
      return TrendingUp
    if (
      lowerName.includes('契約') ||
      lowerName.includes('成約') ||
      lowerName.includes('contract') ||
      lowerName.includes('closed')
    )
      return CheckCircle2
    if (lowerName.includes('顧客') || lowerName.includes('customer')) return Users
    return Target
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#71717B]">総レコード数</h3>
            <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center">
              <Database className="w-5 h-5 text-[#71717B]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#09090B]">{totalRecords}</p>
          <p className="text-xs text-[#71717B]">すべてのレコード</p>
        </div>

        {statusStats.map((stat, index) => {
          const StatusIcon = getStatusIcon(stat.name)
          return (
            <div
              key={index}
              className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-[#71717B]">{stat.name}</h3>
                <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center">
                  <StatusIcon className="w-5 h-5 text-[#09090B]" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#09090B]">{stat.count}</p>
              <p className="text-xs text-[#71717B]">レコード</p>
            </div>
          )
        })}

        {statusStats.length < 3 &&
          Array.from({ length: 3 - statusStats.length }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] opacity-50"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-[#71717B]">-</h3>
                <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center">
                  <Database className="w-5 h-5 text-[#A1A1AA]" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#09090B]">0</p>
              <p className="text-xs text-[#71717B]">レコード</p>
            </div>
          ))}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/dashboard/tables/${table.id}/data`}
          className="flex items-center gap-2 px-4 py-2 border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors text-sm font-medium"
        >
          <Maximize2 className="w-4 h-4" />
          全画面で表示
        </Link>
        <button
          onClick={() => setShowAddRecord(true)}
          className="flex items-center gap-2 bg-[#09090B] text-white px-4 py-2 rounded-lg hover:bg-[#27272A] transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          レコードを追加
        </button>
      </div>

      {/* Compact Table */}
      <CompactTableView
        columns={columns}
        statuses={statuses}
        customers={customers}
        tableId={table.id}
        maxRows={10}
      />

      {/* Add Record Modal */}
      {showAddRecord && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setShowAddRecord(false)} />
          <AddRecordModalWithImport
            tableId={table.id}
            columns={columns}
            statuses={statuses}
            organizationId={table.organization_id}
            onClose={() => setShowAddRecord(false)}
          />
        </>
      )}
    </>
  )
}
