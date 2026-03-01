import { NextResponse } from 'next/server'
import { getCacheStats } from '@/lib/db/cache'

export async function GET() {
  try {
    const stats = await getCacheStats()
    return NextResponse.json({ success: true, stats })
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get cache stats' },
      { status: 500 }
    )
  }
}