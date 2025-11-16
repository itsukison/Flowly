import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const { label, name, type, options, is_required, display_order } = body

    const updateData: any = {}
    if (label !== undefined) updateData.label = label
    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type
    if (options !== undefined) updateData.options = options
    if (is_required !== undefined) updateData.is_required = is_required
    if (display_order !== undefined) updateData.display_order = display_order

    const { data, error } = await supabase
      .from('table_columns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating column:', error)
    return NextResponse.json(
      { error: 'Failed to update column' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('table_columns')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting column:', error)
    return NextResponse.json(
      { error: 'Failed to delete column' },
      { status: 500 }
    )
  }
}
