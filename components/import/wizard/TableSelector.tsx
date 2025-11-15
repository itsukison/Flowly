'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import CreateTableModal from '../dashboard/CreateTableModal'

interface Table {
  id: string
  name: string
  icon: string | null
  description: string | null
}

interface TableSelectorProps {
  tables: Table[]
  onSelect: (table: Table) => void
  organizationId: string
}

export default function TableSelector({ tables, onSelect, organizationId }: TableSelectorProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div>
      <h2 className="text-xl font-bold text-[#09090B] mb-4">
        インポート先のテーブルを選択
      </h2>
      <p className="text-[#71717B] mb-6">
        データをインポートするテーブルを選択してください
      </p>

      {tables.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-[#F4F4F5] flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-[#71717B]" />
          </div>
          <h3 className="text-lg font-semibold text-[#09090B] mb-2">
            テーブルがありません
          </h3>
          <p className="text-[#71717B] mb-6">
            最初にテーブルを作成してください
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-[#09090B] text-white px-6 py-3 rounded-lg hover:bg-[#27272A] transition-colors"
          >
            <Plus className="w-5 h-5" />
            テーブルを作成
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tables.map((table) => (
            <button
              key={table.id}
              onClick={() => onSelect(table)}
              className="w-full flex items-center gap-4 p-4 border-2 border-[#E4E4E7] rounded-xl hover:border-[#09090B] transition-all text-left"
            >
              <div className="text-3xl">{table.icon || '📊'}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#09090B]">{table.name}</h3>
                {table.description && (
                  <p className="text-sm text-[#71717B] mt-1">{table.description}</p>
                )}
              </div>
              <div className="text-[#71717B]">→</div>
            </button>
          ))}

          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-[#E4E4E7] rounded-xl hover:border-[#09090B] transition-all text-[#71717B] hover:text-[#09090B]"
          >
            <Plus className="w-5 h-5" />
            新しいテーブルを作成
          </button>
        </div>
      )}

      {showCreateModal && (
        <CreateTableModal
          organizationId={organizationId}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  )
}
