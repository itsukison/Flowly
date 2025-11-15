import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { transformToRecord } from '@/lib/records/transform'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { table_id, organization_id, user_id, data, mapping, options } = body

    // Common fields that go to top-level columns
    const commonFields = ['name', 'email', 'company', 'status']
    
    // Process each row
    const recordsToInsert = []
    const processedNames = new Set()

    for (const row of data) {
      const formData: any = {
        status: 'リード', // Default status
      }

      // Map fields from source to target
      Object.entries(mapping).forEach(([sourceCol, targetField]: [string, any]) => {
        const value = row[sourceCol]
        if (value) {
          // Handle company_name -> company mapping
          if (targetField === 'company_name') {
            formData.company = value
          } else {
            formData[targetField] = value
          }
        }
      })

      // Handle deduplication
      if (options.deduplicate && formData.name) {
        const normalizedName = formData.name.toLowerCase().trim()
        if (processedNames.has(normalizedName)) {
          continue // Skip duplicate
        }
        processedNames.add(normalizedName)
      }

      // Transform to record structure (separates common fields from data JSONB)
      const recordData = transformToRecord(formData)

      recordsToInsert.push({
        table_id,
        organization_id,
        created_by: user_id,
        ...recordData,
      })
    }

    // Batch insert into records table
    const { data: insertedRecords, error: insertError } = await supabase
      .from('records')
      .insert(recordsToInsert)
      .select()

    if (insertError) throw insertError

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
