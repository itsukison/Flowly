import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCustomers } from '@/lib/services/customerService'
import CustomerList from '@/components/customers/CustomerList'
import { Plus } from 'lucide-react'

interface SearchParams {
  page?: string
  search?: string
  status?: string
  action?: string
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const params = await searchParams
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's organization
  const { data: userProfile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userProfile?.organization_id) {
    redirect('/dashboard')
  }

  // Parse filters from search params
  const page = parseInt(params.page || '1')
  const search = params.search || ''
  const statusFilter = params.status ? params.status.split(',') : []

  // Get customers
  const { customers, total, totalPages } = await getCustomers(
    userProfile.organization_id,
    {
      search,
      status: statusFilter.length > 0 ? statusFilter : undefined,
    },
    { page, perPage: 20 }
  )

  // Get all users for assignment dropdown
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('organization_id', userProfile.organization_id)

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#09090B] mb-2">
              顧客管理
            </h1>
            <p className="text-[#71717B]">
              {total}件の顧客
            </p>
          </div>
          <button
            className="flex items-center gap-2 bg-[#09090B] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#27272A] transition-colors"
            data-action="add-customer"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden md:inline">顧客を追加</span>
          </button>
        </div>

        {/* Customer List */}
        <CustomerList
          customers={customers}
          users={users || []}
          total={total}
          page={page}
          totalPages={totalPages}
          currentUserId={user.id}
          organizationId={userProfile.organization_id}
        />
      </div>
    </div>
  )
}
