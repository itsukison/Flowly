import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TableMainView from '@/components/tables/views/TableMainView'
import { TablePageWrapper } from '@/components/tables/views/TablePageWrapper'

export default async function TablePage({ params }: { params: Promise<{ tableId: string }> }) {
  const supabase = await createClient()
  const { tableId } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch table data first to verify table exists
  const { data: table, error: tableError } = await supabase
    .from('tables')
    .select('*')
    .eq('id', tableId)
    .single()

  if (tableError || !table) {
    redirect('/dashboard')
  }

  // Fetch columns, statuses, and records in parallel for better performance
  const [columnsResult, statusesResult, recordsResult] = await Promise.all([
    supabase
      .from('table_columns')
      .select('*')
      .eq('table_id', tableId)
      .order('display_order', { ascending: true }),
    supabase
      .from('table_statuses')
      .select('*')
      .eq('table_id', tableId)
      .order('display_order', { ascending: true }),
    supabase
      .from('records')
      .select('*')
      .eq('table_id', tableId)
      .order('created_at', { ascending: false })
      .range(0, 49) // Limit to first 50 records for better performance
  ])

  const { data: columns } = columnsResult
  const { data: statuses } = statusesResult
  const { data: records } = recordsResult

  return (
    <TablePageWrapper title={table.name}>
      <TableMainView
        table={table}
        columns={columns || []}
        statuses={statuses || []}
        records={records || []}
      />
    </TablePageWrapper>
  )
}
