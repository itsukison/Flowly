'use client'

import { useState } from 'react'
import { MoreVertical, Edit, Trash2 } from 'lucide-react'
import DynamicFieldRenderer from './DynamicFieldRenderer'
import EditRecordModal from './EditRecordModal'
import DeleteRecordModal from './DeleteRecordModal'
import { Checkbox } from '@/components/ui/checkbox'

interface Column {
  id: string
  name: string
  label: string
  type: string
  options: any
  is_required: boolean | null
}

interface Status {
  id: string
  name: string
  color: string | null
}

interface Customer {
  id: string
  [key: string]: any
}

interface DynamicTableProps {
  columns: Column[]
  statuses: Status[]
  customers: Customer[]
  tableId: string
  onSelectionChange?: (selectedIds: string[]) => void
}

export default function DynamicTable({ columns, statuses, customers, tableId, onSelectionChange }: DynamicTableProps) {
  const [editingRecord, setEditingRecord] = useState<Customer | null>(null)
  const [deletingRecord, setDeletingRecord] = useState<Customer | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const handleSelectAll = (checked: boolean) => {
    const newSelected = checked ? new Set(customers.map(c => c.id)) : new Set<string>()
    setSelectedIds(newSelected)
    onSelectionChange?.(Array.from(newSelected))
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
    onSelectionChange?.(Array.from(newSelected))
  }

  const isAllSelected = customers.length > 0 && selectedIds.size === customers.length
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < customers.length

  if (customers.length === 0) {
    return (
      <div className="bg-white border border-[#E4E4E7] rounded-2xl p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[#F4F4F5] flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#71717B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-[#09090B] mb-2">
          レコードがありません
        </h3>
        <p className="text-[#71717B]">
          最初のレコードを追加してください
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white border border-[#E4E4E7] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F4F4F5] border-b border-[#E4E4E7]">
              <tr>
                <th className="px-6 py-3 text-left">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="すべて選択"
                  />
                </th>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className="px-6 py-3 text-left text-xs font-medium text-[#71717B] uppercase tracking-wider whitespace-nowrap"
                  >
                    {column.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-[#71717B] uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#71717B] uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7]">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="px-6 py-4">
                    <Checkbox
                      checked={selectedIds.has(customer.id)}
                      onCheckedChange={(checked) => handleSelectOne(customer.id, checked as boolean)}
                      aria-label={`選択: ${customer.name || customer.id}`}
                    />
                  </td>
                  {columns.map((column) => (
                    <td key={column.id} className="px-6 py-4 whitespace-nowrap">
                      <DynamicFieldRenderer
                        column={column}
                        value={customer[column.name] || customer.custom_fields?.[column.name]}
                        readOnly
                      />
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.status && (
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${statuses.find(s => s.name === customer.status)?.color || '#71717B'}20`,
                          color: statuses.find(s => s.name === customer.status)?.color || '#71717B',
                        }}
                      >
                        {customer.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === customer.id ? null : customer.id)}
                      className="p-2 hover:bg-[#F4F4F5] rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-[#71717B]" />
                    </button>

                    {openMenuId === customer.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E4E4E7] rounded-lg shadow-lg z-20">
                          <button
                            onClick={() => {
                              setOpenMenuId(null)
                              setEditingRecord(customer)
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[#F4F4F5] transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            編集
                          </button>
                          <button
                            onClick={() => {
                              setOpenMenuId(null)
                              setDeletingRecord(customer)
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            削除
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          columns={columns}
          statuses={statuses}
          tableId={tableId}
          onClose={() => setEditingRecord(null)}
        />
      )}

      {deletingRecord && (
        <DeleteRecordModal
          record={deletingRecord}
          onClose={() => setDeletingRecord(null)}
        />
      )}
    </>
  )
}
