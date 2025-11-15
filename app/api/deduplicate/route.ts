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

    // Get records
    const { data: records, error } = await supabase
      .from('records')
      .select('*')
      .in('id', ids)

    if (error) throw error

    // Simple duplicate detection by name
    const duplicateGroups: Record<string, any[]> = {}
    records?.forEach(record => {
      const key = record.name?.toLowerCase().trim()
      if (key) {
        if (!duplicateGroups[key]) {
          duplicateGroups[key] = []
        }
        duplicateGroups[key].push(record)
      }
    })

    // Find groups with duplicates
    const duplicates = Object.values(duplicateGroups).filter(group => group.length > 1)

    return NextResponse.json({
      success: true,
      duplicateGroups: duplicates.length,
      totalDuplicates: duplicates.reduce((sum, group) => sum + group.length - 1, 0),
    })
  } catch (error) {
    console.error('Deduplication error:', error)
    return NextResponse.json(
      { error: 'Failed to detect duplicates' },
      { status: 500 }
    )
  }
}
