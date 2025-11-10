import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { table_id, organization_id, user_id, data, mapping, options } = body

    const standardFields = ['name', 'email', 'phone', 'company_name', 'company_domain', 'address', 'industry', 'employee_count', 'name_furigana']
    
    // Process each row
    const recordsToInsert = []
    const processedNames = new Set()

    for (const row of data) {
      const customerData: any = {
        organization_id,
        table_id,
        created_by: user_id,
        status: 'リード', // Default status
      }
      const customFields: any = {}

      // Map fields
      Object.entries(mapping).forEach(([sourceCol, targetField]: [string, any]) => {
        const value = row[sourceCol]
        if (value) {
          if (standardFields.includes(targetField)) {
            customerData[targetField] = value
          } else {
            customFields[targetField] = value
          }
        }
      })

      // Handle deduplication
      if (options.deduplicate && customerData.name) {
        const normalizedName = customerData.name.toLowerCase().trim()
        if (processedNames.has(normalizedName)) {
          continue // Skip duplicate
        }
        processedNames.add(normalizedName)
      }

      customerData.custom_fields = customFields
      recordsToInsert.push(customerData)
    }

    // Batch insert
    const { data: insertedRecords, error: insertError } = await supabase
      .from('customers')
      .insert(recordsToInsert)
      .select()

    if (insertError) throw insertError

    // Handle enrichment if requested
    if (options.enrich && insertedRecords) {
      // Queue enrichment jobs (implement later)
      // For now, just mark as pending
      const recordsToEnrich = insertedRecords.filter(r => !r.email || !r.phone)
      if (recordsToEnrich.length > 0) {
        await supabase
          .from('customers')
          .update({ enrichment_status: 'pending' })
          .in('id', recordsToEnrich.map(r => r.id))
      }
    }

    return NextResponse.json({
      success: true,
      imported: insertedRecords?.length || 0,
      skipped: data.length - recordsToInsert.length,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import data' },
      { status: 500 }
    )
  }
}
