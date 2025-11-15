import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId: id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { count, error } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('table_id', id)

    if (error) throw error

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error('Error fetching count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch count' },
      { status: 500 }
    )
  }
}
