'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Users } from 'lucide-react'
import { findDuplicatesInImport, mergeCustomers, updateCustomerFromImport } from '@/lib/services/importService'

interface DuplicateResolverProps {
  rows: any[]
  organizationId: string
  userId: string
  onComplete: (rowsToImport: any[], duplicates: any[]) => void
  onBack: () => void
}

type DuplicateAction = 'skip' | 'overwrite' | 'merge' | 'create'

export default function DuplicateResolver({
  rows,
  organizationId,
  userId,
  onComplete,
  onBack,
}: DuplicateResolverProps) {
  const [checking, setChecking] = useState(true)
  const [duplicates, setDuplicates] = useState<any[]>([])
  const [actions, setActions] = useState<Record<number, DuplicateAction>>({})

  useEffect(() => {
    checkDuplicates()
  }, [])

  const checkDuplicates = async () => {
    try {
      const found = await findDuplicatesInImport(rows, organizationId)
      setDuplicates(found)
      
      // Default action: skip
      const defaultActions: Record<number, DuplicateAction> = {}
      found.forEach((_, index) => {
        defaultActions[index] = 'skip'
      })
      setActions(defaultActions)
    } catch (error) {
      console.error('Error checking duplicates:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleActionChange = (index: number, action: DuplicateAction) => {
    setActions(prev => ({ ...prev, [index]: action }))
  }

  const handleBulkAction = (action: DuplicateAction) => {
    const newActions: Record<number, DuplicateAction> = {}
    duplicates.forEach((_, index) => {
      newActions[index] = action
    })
    setActions(newActions)
  }

  const handleContinue = () => {
    // Filter rows based on actions
    const rowsToImport = rows.filter((row, index) => {
      const dupIndex = duplicates.findIndex(d => d.importRow === row)
      if (dupIndex === -1) return true // Not a duplicate, include
      
      const action = actions[dupIndex]
      return action === 'create' // Only include if action is 'create'
    })

    onComplete(rowsToImport, duplicates)
  }

  if (checking) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-[#E4E4E7] border-t-[#09090B] rounded-full mx-auto mb-4" />
        <p className="text-[#71717B]">重複をチェック中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#09090B] mb-2">
          重複の確認
        </h2>
        <p className="text-[#71717B]">
          既存の顧客と類似するデータが見つかりました
        </p>
      </div>

      {duplicates.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-green-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#09090B] mb-2">
            重複は見つかりませんでした
          </h3>
          <p className="text-[#71717B] mb-6">
            すべてのデータを安全にインポートできます
          </p>
          <button
            onClick={handleContinue}
            className="px-6 py-3 bg-[#09090B] text-white rounded-xl font-semibold hover:bg-[#27272A] transition-colors"
          >
            インポートを開始
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">
              <strong>{duplicates.length}件</strong>の重複の可能性がある顧客が見つかりました
            </p>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#71717B]">一括操作:</span>
            <button
              onClick={() => handleBulkAction('skip')}
              className="px-4 py-2 text-sm border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors"
            >
              すべてスキップ
            </button>
            <button
              onClick={() => handleBulkAction('merge')}
              className="px-4 py-2 text-sm border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors"
            >
              すべてマージ
            </button>
            <button
              onClick={() => handleBulkAction('create')}
              className="px-4 py-2 text-sm border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors"
            >
              すべて新規作成
            </button>
          </div>

          {/* Duplicate Cards */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {duplicates.map((dup, index) => (
              <div key={index} className="border border-[#E4E4E7] rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Import Data */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-700 mb-2">
                      インポートデータ
                    </p>
                    <div className="space-y-1 text-sm text-blue-900">
                      <p><strong>名前:</strong> {dup.importRow.name}</p>
                      {dup.importRow.email && (
                        <p><strong>メール:</strong> {dup.importRow.email}</p>
                      )}
                      {dup.importRow.phone && (
                        <p><strong>電話:</strong> {dup.importRow.phone}</p>
                      )}
                      {dup.importRow.company_name && (
                        <p><strong>会社:</strong> {dup.importRow.company_name}</p>
                      )}
                    </div>
                  </div>

                  {/* Existing Data */}
                  <div className="bg-[#FAFAFA] rounded-lg p-4">
                    <p className="text-sm font-semibold text-[#09090B] mb-2">
                      既存データ
                    </p>
                    <div className="space-y-1 text-sm text-[#71717B]">
                      <p><strong>名前:</strong> {dup.existingCustomer.name}</p>
                      {dup.existingCustomer.email && (
                        <p><strong>メール:</strong> {dup.existingCustomer.email}</p>
                      )}
                      {dup.existingCustomer.phone && (
                        <p><strong>電話:</strong> {dup.existingCustomer.phone}</p>
                      )}
                      {dup.existingCustomer.company_name && (
                        <p><strong>会社:</strong> {dup.existingCustomer.company_name}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-[#71717B]">一致理由:</span>
                  {dup.matchReasons.map((reason: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full"
                    >
                      {reason}
                    </span>
                  ))}
                  <span className="text-xs text-[#71717B]">
                    ({Math.round(dup.matchScore * 100)}% 一致)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#71717B]">アクション:</span>
                  <select
                    value={actions[index] || 'skip'}
                    onChange={(e) => handleActionChange(index, e.target.value as DuplicateAction)}
                    className="flex-1 px-4 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:border-[#09090B] text-sm"
                  >
                    <option value="skip">スキップ（既存データを保持）</option>
                    <option value="merge">マージ（両方の情報を統合）</option>
                    <option value="create">新規作成（重複ではない）</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={onBack}
              className="flex-1 px-6 py-3 border border-[#E4E4E7] rounded-xl font-semibold hover:bg-[#F4F4F5] transition-colors"
            >
              戻る
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 px-6 py-3 bg-[#09090B] text-white rounded-xl font-semibold hover:bg-[#27272A] transition-colors"
            >
              インポートを開始
            </button>
          </div>
        </>
      )}
    </div>
  )
}
