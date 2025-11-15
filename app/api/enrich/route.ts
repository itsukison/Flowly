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
    // Fetch current records to update their data field
    const { data: records, error: fetchError } = await supabase
      .from('records')
      .select('id, data')
      .in('id', ids)

    if (fetchError) {
      console.warn('Could not fetch records for enrichment:', fetchError)
    } else if (records) {
      // Update each record with enrichment_status in data JSONB
      for (const record of records) {
        const updatedData = {
          ...(record.data as Record<string, any> || {}),
          enrichment_status: 'pending'
        }
        
        await supabase
          .from('records')
          .update({ data: updatedData })
          .eq('id', record.id)
      }
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
