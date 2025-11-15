import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/tables/[tableId]/customers
 * Create a new customer record
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const supabase = await createClient()
    const { tableId } = await params
    const body = await request.json()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify table belongs to user's organization
    const { data: table } = await supabase
      .from('tables')
      .select('organization_id')
      .eq('id', tableId)
      .single()

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    // Get user's current organization
    const { data: userProfile } = await supabase
      .from('users')
      .select('current_organization_id')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.current_organization_id !== table.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create customer
    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        table_id: tableId,
        organization_id: table.organization_id,
        ...body,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating customer:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ customer }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/tables/[tableId]/customers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
