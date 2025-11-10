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
    const { table_id, name, color, display_order } = body

    const { data, error } = await supabase
      .from('table_statuses')
      .insert({
        table_id,
        name,
        color,
        display_order,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating status:', error)
    return NextResponse.json(
      { error: 'Failed to create status' },
      { status: 500 }
    )
  }
}
