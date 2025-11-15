import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { transformToRecord, validateAgainstSchema } from '@/lib/records/transform'

// GET /api/records - List records for a table
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tableId = searchParams.get('table_id')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!tableId) {
      return NextResponse.json({ error: 'table_id is required' }, { status: 400 })
    }

    let query = supabase
      .from('records')
      .select('*', { count: 'exact' })
      .eq('table_id', tableId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({ data, count })
  } catch (error) {
    console.error('Error fetching records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch records' },
      { status: 500 }
    )
  }
}

// POST /api/records - Create a new record
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { table_id, organization_id, ...formData } = body

    if (!table_id || !organization_id) {
      return NextResponse.json(
        { error: 'table_id and organization_id are required' },
        { status: 400 }
      )
    }

    // Get table schema for validation
    const { data: table } = await supabase
      .from('tables')
      .select('schema')
      .eq('id', table_id)
      .single()

    // Validate against schema
    if (table?.schema) {
      const validation = validateAgainstSchema(formData, table.schema)
      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.errors },
          { status: 400 }
        )
      }
    }

    // Transform data to record structure
    const recordData = transformToRecord(formData, table?.schema)

    // Insert record
    const { data, error } = await supabase
      .from('records')
      .insert({
        table_id,
        organization_id,
        ...recordData,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating record:', error)
    return NextResponse.json(
      { error: 'Failed to create record' },
      { status: 500 }
    )
  }
}
