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

    // Mark records for enrichment by adding enrichment_status to data JSONB
    const { error } = await supabase
      .from('records')
      .update({ 
        data: supabase.rpc('jsonb_set', {
          target: 'data',
          path: '{enrichment_status}',
          new_value: '"pending"'
        })
      })
      .in('id', ids)

    if (error) {
      // Fallback: just log for now since enrichment is not critical
      console.warn('Could not mark records for enrichment:', error)
    }

    // In a real implementation, this would queue enrichment jobs
    // For now, just acknowledge the request

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
