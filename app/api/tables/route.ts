import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTemplateColumns, getTemplateStatuses } from '@/lib/templates/tableTemplates'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organization_id, name, description, icon, template_type } = body

    // Create table
    const { data: table, error: tableError } = await supabase
      .from('tables')
      .insert({
        organization_id,
        name,
        description,
        icon,
        template_type,
        created_by: user.id,
      })
      .select()
      .single()

    if (tableError) throw tableError

    // Create default columns based on template
    const columns = getTemplateColumns(template_type)
    if (columns.length > 0) {
      const { error: columnsError } = await supabase
        .from('table_columns')
        .insert(
          columns.map((col, index) => ({
            table_id: table.id,
            ...col,
            display_order: index + 1,
          }))
        )

      if (columnsError) throw columnsError
    }

    // Create default statuses based on template
    const statuses = getTemplateStatuses(template_type)
    if (statuses.length > 0) {
      const { error: statusesError } = await supabase
        .from('table_statuses')
        .insert(
          statuses.map((status, index) => ({
            table_id: table.id,
            ...status,
            display_order: index + 1,
          }))
        )

      if (statusesError) throw statusesError
    }

    return NextResponse.json(table)
  } catch (error) {
    console.error('Error creating table:', error)
    return NextResponse.json(
      { error: 'Failed to create table' },
      { status: 500 }
    )
  }
}
