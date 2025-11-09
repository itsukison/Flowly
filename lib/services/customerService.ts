import { createClient } from '@/lib/supabase/server'
import { Customer, CustomerInsert, CustomerUpdate } from '@/lib/supabase/types'

export interface DashboardStats {
  totalCustomers: number
  newThisWeek: number
  inNegotiation: number
  activityThisWeek: number
  statusBreakdown: { status: string; count: number }[]
}

export interface CustomerFilters {
  search?: string
  status?: string[]
  assignedTo?: string
  lastContactFrom?: string
  lastContactTo?: string
  missingEmail?: boolean
  missingPhone?: boolean
  missingAddress?: boolean
  createdFrom?: string
  createdTo?: string
}

export interface Pagination {
  page: number
  perPage: number
}

export async function getDashboardStats(organizationId: string): Promise<DashboardStats> {
  const supabase = await createClient()
  
  // Get total customers
  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  // Get new customers this week
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  const { count: newThisWeek } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', oneWeekAgo.toISOString())

  // Get customers in negotiation
  const { count: inNegotiation } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', '商談中')

  // Get activity this week
  const { count: activityThisWeek } = await supabase
    .from('customer_activity_log')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', oneWeekAgo.toISOString())

  // Get status breakdown
  const { data: statusData } = await supabase
    .from('customers')
    .select('status')
    .eq('organization_id', organizationId)

  const statusBreakdown = statusData?.reduce((acc: { status: string; count: number }[], curr) => {
    const existing = acc.find(item => item.status === curr.status)
    if (existing) {
      existing.count++
    } else {
      acc.push({ status: curr.status, count: 1 })
    }
    return acc
  }, []) || []

  return {
    totalCustomers: totalCustomers || 0,
    newThisWeek: newThisWeek || 0,
    inNegotiation: inNegotiation || 0,
    activityThisWeek: activityThisWeek || 0,
    statusBreakdown,
  }
}

export async function getRecentActivity(organizationId: string, limit: number = 10) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('customer_activity_log')
    .select(`
      *,
      customer:customers(name),
      user:users(full_name, email)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function getCustomers(
  organizationId: string,
  filters: CustomerFilters = {},
  pagination: Pagination = { page: 1, perPage: 20 }
) {
  const supabase = await createClient()
  
  let query = supabase
    .from('customers')
    .select(`
      *,
      assigned_user:users!customers_assigned_to_fkey(id, full_name, email),
      created_by_user:users!customers_created_by_fkey(id, full_name, email)
    `, { count: 'exact' })
    .eq('organization_id', organizationId)

  // Apply filters
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`)
  }

  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  if (filters.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo)
  }

  if (filters.lastContactFrom) {
    query = query.gte('last_contact_date', filters.lastContactFrom)
  }

  if (filters.lastContactTo) {
    query = query.lte('last_contact_date', filters.lastContactTo)
  }

  if (filters.missingEmail) {
    query = query.is('email', null)
  }

  if (filters.missingPhone) {
    query = query.is('phone', null)
  }

  if (filters.missingAddress) {
    query = query.is('address', null)
  }

  if (filters.createdFrom) {
    query = query.gte('created_at', filters.createdFrom)
  }

  if (filters.createdTo) {
    query = query.lte('created_at', filters.createdTo)
  }

  // Apply pagination
  const from = (pagination.page - 1) * pagination.perPage
  const to = from + pagination.perPage - 1
  
  query = query.range(from, to).order('created_at', { ascending: false })

  const { data, error, count } = await query

  if (error) throw error

  return {
    customers: data || [],
    total: count || 0,
    page: pagination.page,
    perPage: pagination.perPage,
    totalPages: Math.ceil((count || 0) / pagination.perPage),
  }
}

export async function getCustomer(customerId: string, organizationId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      assigned_user:users!customers_assigned_to_fkey(id, full_name, email),
      created_by_user:users!customers_created_by_fkey(id, full_name, email),
      activity_log:customer_activity_log(
        *,
        user:users(full_name, email)
      )
    `)
    .eq('id', customerId)
    .eq('organization_id', organizationId)
    .single()

  if (error) throw error
  return data
}

export async function createCustomer(
  data: CustomerInsert,
  userId: string
): Promise<Customer> {
  const supabase = await createClient()
  
  // Extract domain from email if provided
  let companyDomain = data.company_domain
  if (data.email && !companyDomain) {
    const emailParts = data.email.split('@')
    if (emailParts.length === 2) {
      companyDomain = emailParts[1]
    }
  }

  const { data: customer, error } = await supabase
    .from('customers')
    .insert({
      ...data,
      company_domain: companyDomain,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error

  // Log activity
  await supabase.from('customer_activity_log').insert({
    customer_id: customer.id,
    organization_id: customer.organization_id,
    user_id: userId,
    action_type: 'created',
    changes: { customer },
  })

  return customer
}

export async function updateCustomer(
  customerId: string,
  organizationId: string,
  data: CustomerUpdate,
  userId: string
): Promise<Customer> {
  const supabase = await createClient()
  
  // Get current customer data for change tracking
  const { data: currentCustomer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .eq('organization_id', organizationId)
    .single()

  const { data: customer, error } = await supabase
    .from('customers')
    .update(data)
    .eq('id', customerId)
    .eq('organization_id', organizationId)
    .select()
    .single()

  if (error) throw error

  // Log activity
  const changes = {
    before: currentCustomer,
    after: customer,
  }

  await supabase.from('customer_activity_log').insert({
    customer_id: customer.id,
    organization_id: customer.organization_id,
    user_id: userId,
    action_type: data.status !== currentCustomer?.status ? 'status_changed' : 'updated',
    changes,
  })

  return customer
}

export async function deleteCustomer(
  customerId: string,
  organizationId: string,
  deleteActivityLog: boolean = false
) {
  const supabase = await createClient()
  
  if (deleteActivityLog) {
    await supabase
      .from('customer_activity_log')
      .delete()
      .eq('customer_id', customerId)
  }

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId)
    .eq('organization_id', organizationId)

  if (error) throw error
}

export async function findDuplicates(
  organizationId: string,
  name: string,
  email?: string
) {
  const supabase = await createClient()
  
  const duplicates = []

  // Check by exact email match
  if (email) {
    const { data: emailMatches } = await supabase
      .from('customers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('email', email)
      .limit(5)

    if (emailMatches && emailMatches.length > 0) {
      duplicates.push(...emailMatches.map(c => ({
        ...c,
        matchReason: 'メールアドレスが一致',
        matchScore: 1.0,
      })))
    }
  }

  // Check by fuzzy name match
  const { data: nameMatches } = await supabase
    .rpc('find_similar_customers', {
      org_id: organizationId,
      customer_name: name,
      threshold: 0.7,
    })

  if (nameMatches && nameMatches.length > 0) {
    duplicates.push(...nameMatches.map((c: any) => ({
      ...c,
      matchReason: '名前が類似',
      matchScore: c.similarity,
    })))
  }

  // Remove duplicates from the array itself
  const uniqueDuplicates = duplicates.filter(
    (item, index, self) => index === self.findIndex(t => t.id === item.id)
  )

  return uniqueDuplicates
}
