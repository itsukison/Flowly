import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TableView from '@/components/tables/EnhancedTableView'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function TablePage({ params }: { params: Promise<{ tableId: string }> }) {
  const supabase = await createClient()
  const { tableId } = await params

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
    .eq('id', tableId)
    .single()

  if (tableError || !table) {
    redirect('/dashboard')
  }

  // Get table columns
  const { data: columns } = await supabase
    .from('table_columns')
    .select('*')
    .eq('table_id', tableId)
    .order('display_order', { ascending: true })

  // Get table statuses
  const { data: statuses } = await supabase
    .from('table_statuses')
    .select('*')
    .eq('table_id', tableId)
    .order('display_order', { ascending: true })

  // Get customers for this table
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('table_id', tableId)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Navigation */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[#71717B] hover:text-[#09090B] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          ダッシュボードに戻る
        </Link>

        {/* Enhanced Table View */}
        <TableView
          table={table}
          columns={columns || []}
          statuses={statuses || []}
          initialCustomers={customers || []}
        />
      </div>
    </div>
  )
}
