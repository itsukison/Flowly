'use client'

import { Loader2 } from 'lucide-react'

export default function ImportProgress() {
  return (
    <div className="text-center py-12">
      <Loader2 className="w-12 h-12 text-[#09090B] animate-spin mx-auto mb-4" />
      <h3 className="text-xl font-bold text-[#09090B] mb-2">
        インポート中...
      </h3>
      <p className="text-[#71717B]">
        データを処理しています。しばらくお待ちください。
      </p>
    </div>
  )
}
