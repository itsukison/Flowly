import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/records/[id] - Get a single record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data, error } = await supabase
      .from('records')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching record:', error)
    return NextResponse.json(
      { error: 'Failed to fetch record' },
      { status: 500 }
    )
  }
}

// PATCH /api/records/[id] - Update a record
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    console.log('PATCH /api/records/[id] - Received update:', { id, body })

    // Get existing record to merge with updates
    const { data: existingRecord, error: fetchError } = await supabase
      .from('records')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingRecord) {
      console.error('Record not found:', fetchError)
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // Prepare update payload - only update fields that are provided
    const updatePayload: any = {}

    // Handle direct fields (name, email, company, status)
    const directFields = ['name', 'email', 'company', 'status']
    directFields.forEach(field => {
      if (field in body) {
        updatePayload[field] = body[field]
      }
    })

    // Handle JSONB data field - merge with existing data
    if ('data' in body && body.data !== null && typeof body.data === 'object') {
      const existingData = (existingRecord.data as Record<string, any>) || {}
      updatePayload.data = {
        ...existingData,
        ...body.data,
      }
    }

    // Add updated_at timestamp
    updatePayload.updated_at = new Date().toISOString()

    console.log('Update payload:', updatePayload)

    // Update record
    const { data, error } = await supabase
      .from('records')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      throw error
    }

    console.log('Update successful:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating record:', error)
    return NextResponse.json(
      { error: 'Failed to update record', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/records/[id] - Delete a record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { error } = await supabase
      .from('records')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting record:', error)
    return NextResponse.json(
      { error: 'Failed to delete record' },
      { status: 500 }
    )
  }
}
