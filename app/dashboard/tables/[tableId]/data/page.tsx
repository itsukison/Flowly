import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TableDataView from '@/components/tables/TableDataView'

export default async function DataPage({ params }: { params: Promise<{ tableId: string }> }) {
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

  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('table_id', tableId)
    .order('created_at', { ascending: false })

  return (
    <TableDataView
      table={table}
      columns={columns || []}
      statuses={statuses || []}
      customers={customers || []}
    />
  )
}
