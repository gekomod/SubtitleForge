import { NextRequest, NextResponse } from 'next/server'

// In-memory library
let library: any[] = []

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10)
  
  if (isNaN(id)) {
    return NextResponse.json(
      { success: false, error: 'Invalid ID' },
      { status: 400 }
    )
  }

  const index = library.findIndex(item => item.id === id)
  if (index !== -1) {
    library.splice(index, 1)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ success: false })
}