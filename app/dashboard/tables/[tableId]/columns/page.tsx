import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ColumnManagerWrapper from '@/components/tables/managers/ColumnManagerWrapper'
import { TablePageWrapper } from '@/components/tables/views/TablePageWrapper'

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

  // Fetch table and columns data in parallel for better performance
  const [tableResult, columnsResult] = await Promise.all([
    supabase
      .from('tables')
      .select('*')
      .eq('id', tableId)
      .single(),
    supabase
      .from('table_columns')
      .select('*')
      .eq('table_id', tableId)
      .order('display_order', { ascending: true })
  ])

  const { data: table, error: tableError } = tableResult

  if (tableError || !table) {
    redirect('/dashboard')
  }

  const { data: columns } = columnsResult

  return (
    <TablePageWrapper title={`${table.name} - 列の管理`}>
      <ColumnManagerWrapper tableId={tableId} columns={columns || []} />
    </TablePageWrapper>
  )
}
