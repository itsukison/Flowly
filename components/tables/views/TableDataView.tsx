'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Filter, RefreshCw, Sparkles } from 'lucide-react'
import HandsontableGrid from '../core/HandsontableGridClient'
import AddRecordModalWithImport from '../modals/AddRecordModalWithImport'

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

interface TableRecord {
  id: string
  name?: string
  email?: string
  company?: string
  status?: string
  data: Record<string, any>
  [key: string]: any
}

interface TableDataViewProps {
  table: any
  columns: Column[]
  statuses: Status[]
  records: TableRecord[]
}

export default function TableDataView({ table, columns, statuses, records }: TableDataViewProps) {
  const router = useRouter()
  const [showAddRecord, setShowAddRecord] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Debug logging
  console.log('TableDataView - records:', records.length, records)
  console.log('TableDataView - columns:', columns.length, columns)
  console.log('TableDataView - statuses:', statuses.length, statuses)

  const handleDeduplicate = async () => {
    if (selectedIds.length === 0) return

    if (!confirm(`${selectedIds.length}件のレコードから重複を検出しますか？`)) {
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/deduplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })

      if (!response.ok) throw new Error('Deduplication failed')

      router.refresh()
      setSelectedIds([])
      alert('重複検出が完了しました')
    } catch (error) {
      console.error('Deduplication error:', error)
      alert('重複検出に失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEnrich = async () => {
    if (selectedIds.length === 0) return

    if (!confirm(`${selectedIds.length}件のレコードをエンリッチしますか？`)) {
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })

      if (!response.ok) throw new Error('Enrichment failed')

      router.refresh()
      setSelectedIds([])
      alert('エンリッチメントをキューに追加しました')
    } catch (error) {
      console.error('Enrichment error:', error)
      alert('エンリッチメントに失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Toolbar */}
      <div className="flex-shrink-0 px-6 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Left side buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button className="flex items-center gap-2 px-3 py-2 border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors whitespace-nowrap text-sm">
              <Filter className="w-4 h-4" />
              フィルター
            </button>
            <button
              onClick={handleDeduplicate}
              disabled={selectedIds.length === 0 || isProcessing}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors whitespace-nowrap text-sm ${
                selectedIds.length > 0
                  ? 'border-[#09090B] bg-[#09090B] text-white hover:bg-[#27272A]'
                  : 'border-[#E4E4E7] text-[#A1A1AA] cursor-not-allowed'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              重複を削除
            </button>
            <button
              onClick={handleEnrich}
              disabled={selectedIds.length === 0 || isProcessing}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors whitespace-nowrap text-sm ${
                selectedIds.length > 0
                  ? 'border-[#09090B] bg-[#09090B] text-white hover:bg-[#27272A]'
                  : 'border-[#E4E4E7] text-[#A1A1AA] cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              情報を補完
            </button>
          </div>
          
          {/* Right side button */}
          <button
            onClick={() => setShowAddRecord(true)}
            className="flex items-center gap-2 bg-[#09090B] text-white px-3 py-2 rounded-lg hover:bg-[#27272A] transition-colors sm:ml-auto flex-shrink-0 w-full sm:w-auto whitespace-nowrap text-sm"
          >
            <Plus className="w-4 h-4" />
            レコードを追加
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 px-6 min-h-0 flex flex-col">
        <HandsontableGrid
          columns={columns}
          statuses={statuses}
          records={records}
          tableId={table.id}
          onSelectionChange={setSelectedIds}
        />
      </div>

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
    </div>
  )
}