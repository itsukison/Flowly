import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ColumnManagerWrapper from '@/components/tables/managers/ColumnManagerWrapper'

export default async function ColumnsPage({
  params,
}: {
  params: Promise<{ tableId: string }>
}) {
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

  return <ColumnManagerWrapper tableId={tableId} columns={columns || []} />
}
