import { NextResponse } from 'next/server'
import { getLibraryStats } from '@/lib/db/library'

export async function GET() {
  try {
    const stats = await getLibraryStats()
    return NextResponse.json({ success: true, stats })
  } catch (error) {
    console.error('Error getting library stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get stats' },
      { status: 500 }
    )
  }
}