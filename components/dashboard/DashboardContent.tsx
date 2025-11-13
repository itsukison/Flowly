'use client'

import TableList from './TableList'

interface DashboardContentProps {
  tables: any[]
  organizationId: string
}

export default function DashboardContent({
  tables,
  organizationId
}: DashboardContentProps) {
  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#09090B]">
            ダッシュボード
          </h1>
        </div>
        <TableList tables={tables || []} organizationId={organizationId} />
      </div>
    </div>
  )
}