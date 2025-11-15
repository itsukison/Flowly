'use client'

import { useState } from 'react'
import { X, Plus, Upload } from 'lucide-react'
import AddRecordModal from './AddRecordModal'
import DataImport from '@/components/import/core/DataImport'

interface AddRecordModalWithImportProps {
  tableId: string
  columns: any[]
  statuses: any[]
  organizationId: string
  onClose: () => void
}

type Mode = 'select' | 'manual' | 'import'

export default function AddRecordModalWithImport({
  tableId,
  columns,
  statuses,
  organizationId,
  onClose,
}: AddRecordModalWithImportProps) {
  const [mode, setMode] = useState<Mode>('select')

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
              onClick={() => setMode('manual')}
              className="group border-2 border-[#E4E4E7] rounded-2xl p-10 hover:border-[#09090B] hover:bg-[#FAFAFA] transition-all"
            >
              <div className="w-20 h-20 rounded-2xl bg-[#F4F4F5] group-hover:bg-[#09090B] flex items-center justify-center mx-auto mb-6 transition-colors">
                <Plus className="w-10 h-10 text-[#09090B] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-[#09090B] mb-3">
                手動で追加
              </h3>
              <p className="text-sm text-[#71717B] leading-relaxed">
                スプレッドシート形式で複数のレコードを入力
              </p>
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
        </div>
      </div>
    </div>
  )
}
