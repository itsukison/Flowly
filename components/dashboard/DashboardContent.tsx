'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import TableList from './TableList'
import CreateTableModal from './CreateTableModal'

interface DashboardContentProps {
  tables: any[]
  organizationId: string
}

export default function DashboardContent({
  tables,
  organizationId
}: DashboardContentProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-2xl md:text-3xl font-bold text-[#09090B]">
            ダッシュボード
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#09090B] text-white px-4 py-2 rounded-lg hover:bg-[#27272A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            新規作成
          </button>
        </div>
        <TableList 
          tables={tables || []} 
          organizationId={organizationId}
        />
      </div>

      {showCreateModal && (
        <CreateTableModal
          organizationId={organizationId}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  )
}