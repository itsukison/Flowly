import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StatusManager from '@/components/tables/StatusManager'
import { getIconComponent } from '@/lib/iconMapping'

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

  const { data: table, error: tableError } = await supabase
    .from('tables')
    .select('*')
    .eq('id', tableId)
    .single()

  if (tableError || !table) {
    redirect('/dashboard')
  }

  const { data: statuses } = await supabase
    .from('table_statuses')
    .select('*')
    .eq('table_id', tableId)
    .order('display_order', { ascending: true })

  const TableIcon = getIconComponent(table.icon)

  return (
    <>
      <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 mb-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-[#09090B] mb-2">基本情報</h3>
          <p className="text-sm text-[#71717B]">
            テーブルの基本情報や表示設定を管理できます。
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-[#09090B] mb-4">基本情報</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#71717B] mb-1">
                  テーブル名
                </label>
                <input
                  type="text"
                  value={table.name}
                  className="w-full px-3 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#09090B]"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#71717B] mb-1">
                  アイコン
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-[#F4F4F5] rounded-lg flex items-center justify-center">
                    <TableIcon className="w-6 h-6 text-[#09090B]" />
                  </div>
                  <button className="px-3 py-1 text-sm border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors">
                    変更
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-[#09090B] mb-4">説明</h4>
            <textarea
              value={table.description || ''}
              className="w-full px-3 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#09090B]"
              rows={3}
              readOnly
            />
          </div>

          <div className="pt-4 border-t border-[#E4E4E7]">
            <button className="px-6 py-2 bg-[#09090B] text-white rounded-lg hover:bg-[#27272A] transition-colors">
              変更を保存
            </button>
          </div>
        </div>
      </div>

      <StatusManager tableId={tableId} statuses={statuses || []} />
    </>
  )
}
