'use client'

import { useState } from 'react'
import { MoreVertical, Edit, Trash2 } from 'lucide-react'
import DynamicFieldRenderer from './DynamicFieldRenderer'
import EditRecordModal from '../modals/EditRecordModal'
import DeleteRecordModal from '../modals/DeleteRecordModal'
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

interface TableRecord {
  id: string
  name?: string
  email?: string
  company?: string
  status?: string
  data: Record<string, any>
  [key: string]: any
}

interface DynamicTableProps {
  columns: Column[]
  statuses: Status[]
  records: TableRecord[]
  tableId: string
  onSelectionChange?: (selectedIds: string[]) => void
}

export default function DynamicTable({ columns, statuses, records, tableId, onSelectionChange }: DynamicTableProps) {
  const [editingRecord, setEditingRecord] = useState<TableRecord | null>(null)
  const [deletingRecord, setDeletingRecord] = useState<TableRecord | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const handleSelectAll = (checked: boolean) => {
    const newSelected = checked ? new Set(records.map(r => r.id)) : new Set<string>()
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

  const isAllSelected = records.length > 0 && selectedIds.size === records.length
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < records.length

  if (records.length === 0) {
    return (
      <div className="bg-white border border-[#E4E4E7] rounded-2xl p-12 text-center max-w-full">
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
      <div className="bg-white border border-[#E4E4E7] rounded-2xl overflow-hidden inline-block min-w-full">
        <table className="w-full">
          <thead className="bg-[#F4F4F5] border-b border-[#E4E4E7]">
            <tr>
              <th className="px-6 py-3 text-left sticky left-0 bg-[#F4F4F5] z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
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
              <th className="px-6 py-3 text-left text-xs font-medium text-[#71717B] uppercase tracking-wider whitespace-nowrap">
                ステータス
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[#71717B] uppercase tracking-wider whitespace-nowrap sticky right-0 bg-[#F4F4F5] z-20 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E7]">
            {records.map((record) => {
              // Helper function to get field value from record
              const getFieldValue = (fieldName: string) => {
                // Check common fields first
                if (fieldName === 'name') return record.name
                if (fieldName === 'email') return record.email
                if (fieldName === 'company' || fieldName === 'company_name') return record.company
                // Then check data JSONB
                return record.data?.[fieldName]
              }

              return (
                <tr key={record.id} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="px-6 py-4 sticky left-0 bg-white z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] group-hover:bg-[#FAFAFA]">
                    <Checkbox
                      checked={selectedIds.has(record.id)}
                      onCheckedChange={(checked) => handleSelectOne(record.id, checked as boolean)}
                      aria-label={`選択: ${record.name || record.id}`}
                    />
                  </td>
                  {columns.map((column) => (
                    <td key={column.id} className="px-6 py-4 whitespace-nowrap">
                      <DynamicFieldRenderer
                        column={column}
                        value={getFieldValue(column.name)}
                        readOnly
                      />
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.status && (
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${statuses.find(s => s.name === record.status)?.color || '#71717B'}20`,
                          color: statuses.find(s => s.name === record.status)?.color || '#71717B',
                        }}
                      >
                        {record.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-white z-10 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)] group-hover:bg-[#FAFAFA]">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === record.id ? null : record.id)}
                      className="p-2 hover:bg-[#F4F4F5] rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-[#71717B]" />
                    </button>

                    {openMenuId === record.id && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E4E4E7] rounded-lg shadow-lg z-40">
                          <button
                            onClick={() => {
                              setOpenMenuId(null)
                              setEditingRecord(record)
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[#F4F4F5] transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            編集
                          </button>
                          <button
                            onClick={() => {
                              setOpenMenuId(null)
                              setDeletingRecord(record)
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
              )
            })}
          </tbody>
        </table>
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
