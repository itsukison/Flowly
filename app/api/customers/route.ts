/**
 * @deprecated This endpoint is deprecated. Use /api/records instead.
 * The customers table has been replaced with a generic records table.
 * This endpoint will be removed in a future version.
 */

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Please use /api/records instead.',
      migration_guide: 'The customers table has been replaced with the records table. Update your API calls to use /api/records.'
    },
    { status: 410 } // 410 Gone
  )
}

export async function GET() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Please use /api/records instead.',
      migration_guide: 'The customers table has been replaced with the records table. Update your API calls to use /api/records.'
    },
    { status: 410 }
  )
}
