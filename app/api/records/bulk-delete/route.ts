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
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids array is required' },
        { status: 400 }
      )
    }

    // Delete records
    const { error } = await supabase
      .from('records')
      .delete()
      .in('id', ids)

    if (error) throw error

    return NextResponse.json({ success: true, deleted: ids.length })
  } catch (error) {
    console.error('Error bulk deleting records:', error)
    return NextResponse.json(
      { error: 'Failed to bulk delete records' },
      { status: 500 }
    )
  }
}
