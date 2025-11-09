import { createClient } from '@/lib/supabase/client'

export interface ImportResult {
  success: number
  failed: number
  skipped: number
  errors: Array<{ row: number; error: string }>
}

export interface DuplicateMatch {
  importRow: Record<string, any>
  existingCustomer: any
  matchScore: number
  matchReasons: string[]
}

// Chunk array into batches
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export async function importCustomers(
  rows: any[],
  organizationId: string,
  userId: string,
  onProgress?: (progress: number, current: number, total: number) => void
): Promise<ImportResult> {
  const supabase = createClient()
  
  const result: ImportResult = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  }

  const batchSize = 50 // Smaller batches for better error handling
  const batches = chunk(rows, batchSize)

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    const startIndex = i * batchSize

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert(batch)
        .select()

      if (error) {
        // If batch fails, try inserting one by one
        for (let j = 0; j < batch.length; j++) {
          try {
            await supabase.from('customers').insert(batch[j])
            result.success++
          } catch (err: any) {
            result.failed++
            result.errors.push({
              row: startIndex + j + 1,
              error: err.message || '不明なエラー',
            })
          }
        }
      } else {
        result.success += batch.length

        // Log activity for successful imports
        const activityLogs = data.map(customer => ({
          customer_id: customer.id,
          organization_id: organizationId,
          user_id: userId,
          action_type: 'created',
          changes: { customer },
        }))

        await supabase.from('customer_activity_log').insert(activityLogs)
      }
    } catch (error: any) {
      result.failed += batch.length
      result.errors.push({
        row: startIndex + 1,
        error: `バッチエラー: ${error.message}`,
      })
    }

    // Update progress
    const progress = ((i + 1) / batches.length) * 100
    const current = Math.min((i + 1) * batchSize, rows.length)
    if (onProgress) {
      onProgress(progress, current, rows.length)
    }
  }

  return result
}

export async function findDuplicatesInImport(
  rows: any[],
  organizationId: string
): Promise<DuplicateMatch[]> {
  const supabase = createClient()
  const duplicates: DuplicateMatch[] = []

  // Check first 100 rows for duplicates (to avoid performance issues)
  const rowsToCheck = rows.slice(0, 100)

  for (const row of rowsToCheck) {
    const matches: DuplicateMatch[] = []

    // Check by exact email match
    if (row.email) {
      const { data: emailMatch } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('email', row.email)
        .limit(1)
        .single()

      if (emailMatch) {
        matches.push({
          importRow: row,
          existingCustomer: emailMatch,
          matchScore: 1.0,
          matchReasons: ['メールアドレスが一致'],
        })
      }
    }

    // Check by phone match
    if (row.phone && matches.length === 0) {
      const { data: phoneMatch } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('phone', row.phone)
        .limit(1)
        .single()

      if (phoneMatch) {
        matches.push({
          importRow: row,
          existingCustomer: phoneMatch,
          matchScore: 0.95,
          matchReasons: ['電話番号が一致'],
        })
      }
    }

    // Check by fuzzy name match
    if (row.name && matches.length === 0) {
      const { data: nameMatches } = await supabase
        .rpc('find_similar_customers', {
          org_id: organizationId,
          customer_name: row.name,
          threshold: 0.8,
        })

      if (nameMatches && nameMatches.length > 0) {
        matches.push({
          importRow: row,
          existingCustomer: nameMatches[0],
          matchScore: nameMatches[0].similarity,
          matchReasons: ['名前が類似'],
        })
      }
    }

    if (matches.length > 0) {
      duplicates.push(matches[0])
    }
  }

  return duplicates
}

export async function updateCustomerFromImport(
  customerId: string,
  data: any,
  organizationId: string,
  userId: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('customers')
    .update(data)
    .eq('id', customerId)
    .eq('organization_id', organizationId)

  if (error) throw error

  // Log activity
  await supabase.from('customer_activity_log').insert({
    customer_id: customerId,
    organization_id: organizationId,
    user_id: userId,
    action_type: 'updated',
    notes: 'インポートから更新',
    changes: { after: data },
  })
}

export async function mergeCustomers(
  existingId: string,
  importData: any,
  organizationId: string,
  userId: string
): Promise<void> {
  const supabase = createClient()

  // Get existing customer
  const { data: existing } = await supabase
    .from('customers')
    .select('*')
    .eq('id', existingId)
    .single()

  if (!existing) throw new Error('既存の顧客が見つかりません')

  // Merge data (import data takes precedence for non-empty fields)
  const merged = {
    ...existing,
    name: importData.name || existing.name,
    name_furigana: importData.name_furigana || existing.name_furigana,
    email: importData.email || existing.email,
    phone: importData.phone || existing.phone,
    company_name: importData.company_name || existing.company_name,
    company_domain: importData.company_domain || existing.company_domain,
    address: importData.address || existing.address,
    industry: importData.industry || existing.industry,
    employee_count: importData.employee_count || existing.employee_count,
  }

  const { error } = await supabase
    .from('customers')
    .update(merged)
    .eq('id', existingId)

  if (error) throw error

  // Log merge activity
  await supabase.from('customer_activity_log').insert({
    customer_id: existingId,
    organization_id: organizationId,
    user_id: userId,
    action_type: 'merged',
    changes: { before: existing, after: merged },
  })
}
