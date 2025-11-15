import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/tables/[tableId]/customers/[customerId]
 * Update a customer record
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string; customerId: string }> }
) {
  try {
    const supabase = await createClient()
    const { tableId, customerId } = await params
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

    // Update customer
    const { data: customer, error } = await supabase
      .from('customers')
      .update(body)
      .eq('id', customerId)
      .eq('table_id', tableId)
      .select()
      .single()

    if (error) {
      console.error('Error updating customer:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error in PATCH /api/tables/[tableId]/customers/[customerId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tables/[tableId]/customers/[customerId]
 * Delete a customer record
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string; customerId: string }> }
) {
  try {
    const supabase = await createClient()
    const { tableId, customerId } = await params

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

    // Delete customer
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId)
      .eq('table_id', tableId)

    if (error) {
      console.error('Error deleting customer:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/tables/[tableId]/customers/[customerId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
