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
    const { ids, updates } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids array is required' },
        { status: 400 }
      )
    }

    // Transform updates to record structure
    const recordData = transformToRecord(updates)

    // Update records
    const { data, error } = await supabase
      .from('records')
      .update(recordData)
      .in('id', ids)
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, updated: data?.length || 0 })
  } catch (error) {
    console.error('Error bulk updating records:', error)
    return NextResponse.json(
      { error: 'Failed to bulk update records' },
      { status: 500 }
    )
  }
}
