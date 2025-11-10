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
      return NextResponse.json({ error: 'Invalid ids' }, { status: 400 })
    }

    // Mark records as pending enrichment
    const { error } = await supabase
      .from('customers')
      .update({ enrichment_status: 'pending' })
      .in('id', ids)

    if (error) throw error

    // In a real implementation, this would queue enrichment jobs
    // For now, just mark as pending

    return NextResponse.json({
      success: true,
      queued: ids.length,
    })
  } catch (error) {
    console.error('Enrichment error:', error)
    return NextResponse.json(
      { error: 'Failed to queue enrichment' },
      { status: 500 }
    )
  }
}
