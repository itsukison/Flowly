'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, Eye, EyeOff, GripVertical, Trash2 } from 'lucide-react'
import AddColumnModal from './AddColumnModal'

interface Column {
  id: string
  name: string
  label: string
  type: string
  options: any
  is_required: boolean
  display_order: number
}

interface ColumnManagerProps {
  tableId: string
  columns: Column[]
  visibleColumns: string[]
  onVisibilityChange: (columns: string[]) => void
  onClose: () => void
}

export default function ColumnManager({
  tableId,
  columns,
  visibleColumns,
  onVisibilityChange,
  onClose,
}: ColumnManagerProps) {
  const router = useRouter()
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const toggleVisibility = (columnId: string) => {
    if (visibleColumns.includes(columnId)) {
      onVisibilityChange(visibleColumns.filter(id => id !== columnId))
    } else {
      onVisibilityChange([...visibleColumns, columnId])
    }
  }

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm('この列を削除してもよろしいですか？データも削除されます。')) {
      return
    }

    setDeleting(columnId)
    try {
      const response = await fetch(`/api/columns/${columnId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete column')

      router.refresh()
    } catch (error) {
      console.error('Error deleting column:', error)
      alert('列の削除に失敗しました')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#09090B]">列を管理</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F4F4F5] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <button
                onClick={() => setShowAddColumn(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#09090B] text-white rounded-lg hover:bg-[#27272A] transition-colors"
              >
                <Plus className="w-4 h-4" />
                列を追加
              </button>
            </div>

            <div className="space-y-2">
              {columns.map((column) => {
                const isVisible = visibleColumns.includes(column.id)
                const isDeleting = deleting === column.id

                return (
                  <div
                    key={column.id}
                    className="flex items-center gap-3 p-4 bg-[#F4F4F5] rounded-lg"
                  >
                    <GripVertical className="w-5 h-5 text-[#71717B] cursor-move" />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-[#09090B]">{column.label}</h3>
                        <span className="text-xs px-2 py-1 bg-white rounded text-[#71717B]">
                          {column.type}
                        </span>
                        {column.is_required && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">
                            必須
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#71717B] mt-1">
                        フィールド名: {column.name}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleVisibility(column.id)}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                      title={isVisible ? '非表示にする' : '表示する'}
                    >
                      {isVisible ? (
                        <Eye className="w-5 h-5 text-[#09090B]" />
                      ) : (
                        <EyeOff className="w-5 h-5 text-[#71717B]" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteColumn(column.id)}
                      disabled={isDeleting}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="削除"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {showAddColumn && (
        <AddColumnModal
          tableId={tableId}
          existingColumns={columns}
          onClose={() => setShowAddColumn(false)}
        />
      )}
    </>
  )
}
