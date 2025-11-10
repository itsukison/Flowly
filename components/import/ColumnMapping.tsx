'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ColumnMappingProps {
  data: any
  tableId: string
  onComplete: (mapping: Record<string, string>) => void
  onBack: () => void
}

export default function ColumnMapping({ data, tableId, onComplete, onBack }: ColumnMappingProps) {
  const [columns, setColumns] = useState<any[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchColumns()
  }, [tableId])

  const fetchColumns = async () => {
    const supabase = createClient()
    const { data: cols } = await supabase
      .from('table_columns')
      .select('*')
      .eq('table_id', tableId)
      .order('display_order')

    setColumns(cols || [])
    
    // Auto-map columns with similar names
    const autoMapping: Record<string, string> = {}
    data.headers.forEach((header: string) => {
      const normalizedHeader = header.toLowerCase().trim()
      const matchingCol = cols?.find(col => 
        col.name.toLowerCase() === normalizedHeader ||
        col.label.toLowerCase() === normalizedHeader
      )
      if (matchingCol) {
        autoMapping[header] = matchingCol.name
      }
    })
    setMapping(autoMapping)
    setLoading(false)
  }

  const handleMappingChange = (sourceColumn: string, targetField: string) => {
    setMapping(prev => ({
      ...prev,
      [sourceColumn]: targetField,
    }))
  }

  const handleContinue = () => {
    // Filter out unmapped columns
    const filteredMapping = Object.fromEntries(
      Object.entries(mapping).filter(([_, value]) => value !== '')
    )
    onComplete(filteredMapping)
  }

  if (loading) {
    return <div className="text-center py-12">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#09090B] mb-2">
          列のマッピング
        </h2>
        <p className="text-[#71717B]">
          インポートファイルの列をテーブルのフィールドに対応付けてください
        </p>
      </div>

      <div className="space-y-3">
        {data.headers.map((header: string) => (
          <div key={header} className="flex items-center gap-4 p-4 bg-[#F4F4F5] rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-[#09090B]">{header}</p>
              <p className="text-sm text-[#71717B] mt-1">
                例: {data.data[0]?.[header] || '-'}
              </p>
            </div>
            <div className="w-8 text-center text-[#71717B]">→</div>
            <div className="flex-1">
              <select
                value={mapping[header] || ''}
                onChange={(e) => handleMappingChange(header, e.target.value)}
                className="w-full px-4 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#09090B]"
              >
                <option value="">マッピングしない</option>
                {columns.map((col) => (
                  <option key={col.id} value={col.name}>
                    {col.label} ({col.type})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors font-medium"
        >
          戻る
        </button>
        <button
          onClick={handleContinue}
          disabled={Object.keys(mapping).length === 0}
          className="flex-1 px-4 py-3 bg-[#09090B] text-white rounded-lg hover:bg-[#27272A] transition-colors font-medium disabled:opacity-50"
        >
          次へ
        </button>
      </div>
    </div>
  )
}
