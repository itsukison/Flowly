import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import StatusManager from '@/components/tables/StatusManager'

export default async function TableSettingsPage({ params }: { params: { tableId: string } }) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get table details
  const { data: table, error: tableError } = await supabase
    .from('tables')
    .select('*')
    .eq('id', params.tableId)
    .single()

  if (tableError || !table) {
    redirect('/dashboard')
  }

  // Get table statuses
  const { data: statuses } = await supabase
    .from('table_statuses')
    .select('*')
    .eq('table_id', params.tableId)
    .order('display_order', { ascending: true })

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link
          href={`/dashboard/tables/${params.tableId}`}
          className="inline-flex items-center gap-2 text-[#71717B] hover:text-[#09090B] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          テーブルに戻る
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="text-4xl">{table.icon || '📊'}</div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#09090B]">
              {table.name} - 設定
            </h1>
          </div>
          <p className="text-[#71717B]">
            ステータスステージを管理
          </p>
        </div>

        <StatusManager
          tableId={params.tableId}
          statuses={statuses || []}
        />
      </div>
    </div>
  )
}
