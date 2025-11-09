'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import { importCustomers } from '@/lib/services/importService'

interface ImportProgressProps {
  rows: any[]
  organizationId: string
  userId: string
  onComplete: (result: any) => void
}

export default function ImportProgress({
  rows,
  organizationId,
  userId,
  onComplete,
}: ImportProgressProps) {
  const [progress, setProgress] = useState(0)
  const [current, setCurrent] = useState(0)
  const [total] = useState(rows.length)
  const [status, setStatus] = useState<'importing' | 'completed' | 'error'>('importing')
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    startImport()
  }, [])

  const startImport = async () => {
    try {
      const importResult = await importCustomers(
        rows,
        organizationId,
        userId,
        (prog, curr, tot) => {
          setProgress(prog)
          setCurrent(curr)
        }
      )

      setResult(importResult)
      setStatus('completed')
      
      // Wait a moment before showing summary
      setTimeout(() => {
        onComplete(importResult)
      }, 1000)
    } catch (error) {
      console.error('Import error:', error)
      setStatus('error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#09090B] mb-2">
          {status === 'importing' && 'インポート中...'}
          {status === 'completed' && 'インポート完了！'}
          {status === 'error' && 'エラーが発生しました'}
        </h2>
        <p className="text-[#71717B]">
          {status === 'importing' && 'データをインポートしています。しばらくお待ちください。'}
          {status === 'completed' && 'すべてのデータが正常にインポートされました。'}
          {status === 'error' && 'インポート中にエラーが発生しました。'}
        </p>
      </div>

      {/* Progress Circle */}
      <div className="flex justify-center">
        {status === 'importing' && (
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#E4E4E7"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#09090B"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-[#09090B]">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        )}

        {status === 'completed' && (
          <div className="w-32 h-32 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
        )}

        {status === 'error' && (
          <div className="w-32 h-32 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle className="w-16 h-16 text-red-600" />
          </div>
        )}
      </div>

      {/* Status Details */}
      <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl p-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-[#71717B] mb-1">処理中</p>
            <p className="text-2xl font-bold text-[#09090B]">
              {current}/{total}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#71717B] mb-1">成功</p>
            <p className="text-2xl font-bold text-green-600">
              {result?.success || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#71717B] mb-1">エラー</p>
            <p className="text-2xl font-bold text-red-600">
              {result?.failed || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {status === 'importing' && (
        <div className="w-full bg-[#E4E4E7] rounded-full h-2">
          <div
            className="bg-[#09090B] h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {status === 'error' && (
        <div className="text-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#09090B] text-white rounded-xl font-semibold hover:bg-[#27272A] transition-colors"
          >
            再試行
          </button>
        </div>
      )}
    </div>
  )
}
