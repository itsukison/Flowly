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

    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .in('id', ids)

    if (error) throw error

    // Convert to CSV
    if (!customers || customers.length === 0) {
      return NextResponse.json({ error: 'No data to export' }, { status: 400 })
    }

    const headers = Object.keys(customers[0]).filter(k => k !== 'custom_fields')
    const csvRows = [
      headers.join(','),
      ...customers.map(customer =>
        headers.map(header => {
          const value = customer[header]
          if (value === null || value === undefined) return ''
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ]

    const csv = csvRows.join('\n')
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="export-${Date.now()}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
