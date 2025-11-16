import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StatusManager from '@/components/tables/managers/StatusManager'
import TableSettingsForm from '@/components/tables/settings/TableSettingsForm'
import { TablePageWrapper } from '@/components/tables/views/TablePageWrapper'

export default async function TableSettingsPage({
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

  // Fetch table and statuses in parallel for better performance
  const [tableResult, statusesResult] = await Promise.all([
    supabase
      .from('tables')
      .select('*')
      .eq('id', tableId)
      .single(),
    supabase
      .from('table_statuses')
      .select('*')
      .eq('table_id', tableId)
      .order('display_order', { ascending: true })
  ])

  const { data: table, error: tableError } = tableResult

  if (tableError || !table) {
    redirect('/dashboard')
  }

  const { data: statuses } = statusesResult

  return (
    <TablePageWrapper title={`${table.name} - 設定`}>
      <div className="space-y-6">
        <TableSettingsForm
          tableId={tableId}
          initialData={table}
        />
        <StatusManager tableId={tableId} statuses={statuses || []} />
      </div>
    </TablePageWrapper>
  )
}
