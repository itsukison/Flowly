import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  try {
    const { organizationName } = await request.json()

    if (!organizationName || organizationName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Organization name must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Get the user's session from cookies
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('sb-qaduzkmlqcilfbvididi-auth-token')
    
    if (!authCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Decode base64 and parse the session
    let session
    try {
      const decoded = Buffer.from(authCookie.value.replace('base64-', ''), 'base64').toString('utf-8')
      session = JSON.parse(decoded)
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid session format' },
        { status: 401 }
      )
    }

    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if user already has an organization
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('current_organization_id')
      .eq('id', userId)
      .single()

    if (existingUser?.current_organization_id) {
      return NextResponse.json(
        { error: 'User already has an organization' },
        { status: 400 }
      )
    }

    // Create the organization
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: organizationName.trim(),
      })
      .select()
      .single()

    if (orgError) {
      console.error('Error creating organization:', orgError)
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      )
    }

    // Link user to organization (upsert to handle case where user record doesn't exist yet)
    const { error: userError } = await supabaseAdmin
      .from('users')
      .upsert({ 
        id: userId,
        current_organization_id: organization.id,
        email: session.user.email,
        role: 'owner',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })

    if (userError) {
      console.error('Error linking user to organization:', userError)
      // Rollback: delete the organization
      await supabaseAdmin
        .from('organizations')
        .delete()
        .eq('id', organization.id)
      
      return NextResponse.json(
        { error: 'Failed to link user to organization' },
        { status: 500 }
      )
    }

    // Also create entry in user_organizations junction table
    await supabaseAdmin
      .from('user_organizations')
      .insert({
        user_id: userId,
        organization_id: organization.id,
        role: 'owner'
      })

    // Invalidate Next.js cache for dashboard and onboarding pages
    revalidatePath('/dashboard')
    revalidatePath('/onboarding')

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name
      }
    })

  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
