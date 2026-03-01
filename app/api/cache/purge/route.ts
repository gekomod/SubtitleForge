import { NextRequest, NextResponse } from 'next/server'
import { purgeOldCache } from '@/lib/db/cache'

export async function POST(request: NextRequest) {
  try {
    const { days = 30 } = await request.json()
    const deleted = await purgeOldCache(days)
    
    return NextResponse.json({ 
      success: true, 
      deleted 
    })
  } catch (error) {
    console.error('Error purging cache:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to purge cache' },
      { status: 500 }
    )
  }
}