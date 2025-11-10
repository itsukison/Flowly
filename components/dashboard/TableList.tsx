'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import { getIconComponent } from '@/lib/iconMapping'
import CreateTableModal from './CreateTableModal'
import EditTableModal from './EditTableModal'
import DeleteTableModal from './DeleteTableModal'

interface Table {
  id: string
  name: string
  icon: string | null
  description: string | null
  created_at: string
}

interface TableListProps {
  tables: Table[]
  organizationId: string
}

export default function TableList({ tables, organizationId }: TableListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [deletingTable, setDeletingTable] = useState<Table | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#09090B]">テーブル一覧</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#09090B] text-white px-4 py-2 rounded-lg hover:bg-[#27272A] transition-colors"
        >
          <Plus className="w-4 h-4" />
          新規作成
        </button>
      </div>

      {tables.length === 0 ? (
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-12 text-center shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <div className="w-16 h-16 rounded-full bg-[#F4F4F5] flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-[#71717B]" />
          </div>
          <h3 className="text-xl font-bold text-[#09090B] mb-2">
            テーブルを作成しましょう
          </h3>
          <p className="text-sm text-[#71717B] mb-6 max-w-md mx-auto">
            顧客、仕入先、イベント参加者など、用途に合わせたテーブルを作成できます
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-[#09090B] text-white px-6 py-3 rounded-full font-semibold text-sm shadow-[0px_4px_20px_rgba(0,0,0,0.15)] hover:bg-[#27272A] hover:shadow-[0px_6px_30px_rgba(0,0,0,0.25)] transition-all"
          >
            <Plus className="w-5 h-5" />
            最初のテーブルを作成
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onEdit={() => setEditingTable(table)}
              onDelete={() => setDeletingTable(table)}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateTableModal
          organizationId={organizationId}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingTable && (
        <EditTableModal
          table={editingTable}
          onClose={() => setEditingTable(null)}
        />
      )}

      {deletingTable && (
        <DeleteTableModal
          table={deletingTable}
          onClose={() => setDeletingTable(null)}
        />
      )}
    </div>
  )
}

function TableCard({
  table,
  onEdit,
  onDelete,
  openMenuId,
  setOpenMenuId,
}: {
  table: Table
  onEdit: () => void
  onDelete: () => void
  openMenuId: string | null
  setOpenMenuId: (id: string | null) => void
}) {
  const [recordCount, setRecordCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch record count on mount
  useState(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch(`/api/tables/${table.id}/count`)
        const data = await response.json()
        setRecordCount(data.count)
      } catch (error) {
        console.error('Failed to fetch record count:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCount()
  })

  const isMenuOpen = openMenuId === table.id
  const IconComponent = getIconComponent(table.icon)

  return (
    <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 hover:border-[#09090B] transition-all relative group shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_4px_20px_rgba(0,0,0,0.15)]">
      <Link href={`/dashboard/tables/${table.id}`} className="block">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#F4F4F5] flex items-center justify-center flex-shrink-0">
              <IconComponent className="w-6 h-6 text-[#09090B]" />
            </div>
            <div>
              <h3 className="font-bold text-[#09090B] text-lg mb-0.5">{table.name}</h3>
              {table.description && (
                <p className="text-sm text-[#71717B]">{table.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#E4E4E7]">
          <div>
            <p className="text-2xl font-bold text-[#09090B]">
              {loading ? '...' : recordCount || 0}
            </p>
            <p className="text-xs text-[#71717B] mt-0.5">レコード</p>
          </div>
          <div className="text-xs text-[#71717B]">
            {new Date(table.created_at).toLocaleDateString('ja-JP')}
          </div>
        </div>
      </Link>

      {/* Action Menu */}
      <div className="absolute top-4 right-4">
        <button
          onClick={(e) => {
            e.preventDefault()
            setOpenMenuId(isMenuOpen ? null : table.id)
          }}
          className="p-2 hover:bg-[#F4F4F5] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreVertical className="w-4 h-4 text-[#71717B]" />
        </button>

        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpenMenuId(null)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E4E4E7] rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.15)] z-20 overflow-hidden">
              <Link
                href={`/dashboard/tables/${table.id}`}
                className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#F4F4F5] transition-colors"
                onClick={() => setOpenMenuId(null)}
              >
                <Eye className="w-4 h-4 text-[#71717B]" />
                <span className="text-[#09090B]">表示</span>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setOpenMenuId(null)
                  onEdit()
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#F4F4F5] transition-colors"
              >
                <Edit className="w-4 h-4 text-[#71717B]" />
                <span className="text-[#09090B]">編集</span>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setOpenMenuId(null)
                  onDelete()
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-[#E4E4E7]"
              >
                <Trash2 className="w-4 h-4" />
                <span>削除</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
