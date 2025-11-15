import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TableMainView from '@/components/tables/views/TableMainView'

export default async function TablePage({ params }: { params: Promise<{ tableId: string }> }) {
  const supabase = await createClient()
  const { tableId } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: table, error: tableError } = await supabase
    .from('tables')
    .select('*')
    .eq('id', tableId)
    .single()

  if (tableError || !table) {
    redirect('/dashboard')
  }

  const { data: columns } = await supabase
    .from('table_columns')
    .select('*')
    .eq('table_id', tableId)
    .order('display_order', { ascending: true })

  const { data: statuses } = await supabase
    .from('table_statuses')
    .select('*')
    .eq('table_id', tableId)
    .order('display_order', { ascending: true })

  const { data: records } = await supabase
    .from('records')
    .select('*')
    .eq('table_id', tableId)
    .order('created_at', { ascending: false })

  return (
    <TableMainView
      table={table}
      columns={columns || []}
      statuses={statuses || []}
      records={records || []}
    />
  )
}
