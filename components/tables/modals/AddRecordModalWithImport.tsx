'use client'

import { useState } from 'react'
import { X, Plus, Upload, MessageSquare } from 'lucide-react'
import AddRecordModal from './AddRecordModal'
import DataImport from '@/components/import/core/DataImport'
import { AIEnrichmentModal } from './AIEnrichmentModal'

interface AddRecordModalWithImportProps {
  tableId: string
  tableName: string
  columns: any[]
  statuses: any[]
  organizationId: string
  onClose: () => void
}

type Mode = 'select' | 'manual' | 'import' | 'ai-enrichment'

export default function AddRecordModalWithImport({
  tableId,
  tableName,
  columns,
  statuses,
  organizationId,
  onClose,
}: AddRecordModalWithImportProps) {
  const [mode, setMode] = useState<Mode>('select')

  const handleEnrichmentStart = async (sessionId: string, requirements: any) => {
    // Modal will handle the generation and progress display
    // Just keep the modal open and let it manage the process
    console.log('Enrichment started with session:', sessionId, 'requirements:', requirements);
  }

  if (mode === 'manual') {
    return (
      <AddRecordModal
        tableId={tableId}
        columns={columns}
        statuses={statuses}
        organizationId={organizationId}
        onClose={onClose}
      />
    )
  }

  if (mode === 'import') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          <div className="sticky top-0 bg-white border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <div>
              <h2 className="text-xl font-bold text-[#09090B]">
                データをインポート
              </h2>
              <p className="text-sm text-[#71717B] mt-1">
                Excel または CSV ファイルからデータをインポート
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F4F4F5] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <DataImport
              tableId={tableId}
              columns={columns}
              onImportComplete={onClose}
            />
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'ai-enrichment') {
    return (
      <AIEnrichmentModal
        open={true}
        onOpenChange={(open) => !open && onClose()}
        tableId={tableId}
        tableName={tableName}
        columns={columns.map(col => ({
          id: col.id,
          name: col.name,
          label: col.label || col.name,
          type: col.type || 'text',
        }))}
        onEnrichmentStart={handleEnrichmentStart}
      />
    )
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl">
        <div className="px-8 py-6 border-b border-[#E4E4E7] flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#09090B]">
            レコードを追加
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F4F4F5] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          <p className="text-[#71717B] mb-8 text-center">
            レコードの追加方法を選択してください
          </p>

          <div className="grid grid-cols-2 gap-6">
            <button
              onClick={() => setMode('ai-enrichment')}
              className="group border-2 border-[#E4E4E7] rounded-2xl p-10 hover:border-[#09090B] hover:bg-[#FAFAFA] transition-all"
            >
              <div className="w-20 h-20 rounded-2xl bg-[#F4F4F5] group-hover:bg-[#09090B] flex items-center justify-center mx-auto mb-6 transition-colors">
                <MessageSquare className="w-10 h-10 text-[#09090B] group-hover:text-white transition-colors" />
              </div>
              <div className="relative">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <h3 className="text-xl font-bold text-[#09090B]">
                    AI データ生成
                  </h3>
                  <span className="px-2 py-1 text-xs bg-[#09090B] text-white rounded-full">
                    新機能
                  </span>
                </div>
                <p className="text-sm text-[#71717B] leading-relaxed text-center">
                  AIと対話してビジネスデータを自動生成。企業情報、連絡先、財務データなどを簡単に作成
                </p>
              </div>
            </button>

            <button
              onClick={() => setMode('import')}
              className="group border-2 border-[#E4E4E7] rounded-2xl p-10 hover:border-[#09090B] hover:bg-[#FAFAFA] transition-all"
            >
              <div className="w-20 h-20 rounded-2xl bg-[#F4F4F5] group-hover:bg-[#09090B] flex items-center justify-center mx-auto mb-6 transition-colors">
                <Upload className="w-10 h-10 text-[#09090B] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-[#09090B] mb-3">
                ファイルをアップロード
              </h3>
              <p className="text-sm text-[#71717B] leading-relaxed">
                Excel または CSV ファイルからインポート
              </p>
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-[#E4E4E7]">
            <button
              onClick={() => setMode('manual')}
              className="w-full text-center text-sm text-[#71717B] hover:text-[#09090B] transition-colors py-2"
            >
              または手動でレコードを追加
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
