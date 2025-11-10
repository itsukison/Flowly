'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, GripVertical, Edit, Trash2 } from 'lucide-react'
import AddStatusModal from './AddStatusModal'
import EditStatusModal from './EditStatusModal'

interface Status {
  id: string
  name: string
  color: string | null
  display_order: number
}

interface StatusManagerProps {
  tableId: string
  statuses: Status[]
}

export default function StatusManager({ tableId, statuses: initialStatuses }: StatusManagerProps) {
  const router = useRouter()
  const [statuses, setStatuses] = useState(initialStatuses)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStatus, setEditingStatus] = useState<Status | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (statusId: string) => {
    if (!confirm('このステータスを削除してもよろしいですか？')) {
      return
    }

    setDeleting(statusId)
    try {
      const response = await fetch(`/api/statuses/${statusId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete status')

      router.refresh()
    } catch (error) {
      console.error('Error deleting status:', error)
      alert('ステータスの削除に失敗しました')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <div className="bg-white border border-[#E4E4E7] rounded-2xl overflow-hidden">
        <div className="border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#09090B]">ステータスステージ</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#09090B] text-white rounded-lg hover:bg-[#27272A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            追加
          </button>
        </div>

        <div className="p-6">
          {statuses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#71717B] mb-4">ステータスがありません</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#09090B] text-white rounded-lg hover:bg-[#27272A] transition-colors"
              >
                <Plus className="w-4 h-4" />
                最初のステータスを追加
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {statuses.map((status) => (
                <div
                  key={status.id}
                  className="flex items-center gap-3 p-4 bg-[#F4F4F5] rounded-lg"
                >
                  <GripVertical className="w-5 h-5 text-[#71717B] cursor-move" />
                  
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: status.color || '#71717B' }}
                  />
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-[#09090B]">{status.name}</h3>
                    <p className="text-sm text-[#71717B]">表示順: {status.display_order}</p>
                  </div>

                  <button
                    onClick={() => setEditingStatus(status)}
                    className="p-2 hover:bg-white rounded-lg transition-colors"
                    title="編集"
                  >
                    <Edit className="w-5 h-5 text-[#09090B]" />
                  </button>

                  <button
                    onClick={() => handleDelete(status.id)}
                    disabled={deleting === status.id}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="削除"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              💡 ステータスをドラッグして並び替えることができます（今後実装予定）
            </p>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddStatusModal
          tableId={tableId}
          existingStatuses={statuses}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingStatus && (
        <EditStatusModal
          status={editingStatus}
          onClose={() => setEditingStatus(null)}
        />
      )}
    </>
  )
}
