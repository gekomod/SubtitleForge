import { NextRequest, NextResponse } from 'next/server'
import { deleteEntry } from '@/lib/db/library'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = parseInt(id, 10)
    
    if (isNaN(numericId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      )
    }

    const success = await deleteEntry(numericId)
    
    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { success: false, error: 'Delete failed' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error deleting entry:', error)
    return NextResponse.json(
      { success: false, error: 'Delete failed' },
      { status: 500 }
    )
  }
}