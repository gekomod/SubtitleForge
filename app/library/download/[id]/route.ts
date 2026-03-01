import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getEntryById } from '@/lib/db/library'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt(params.id, 10)
    
    if (isNaN(id)) {
      return new NextResponse('Invalid ID', { status: 400 })
    }

    const entry = await getEntryById(id)
    
    if (!entry || !entry.file_path) {
      return new NextResponse('Entry not found', { status: 404 })
    }

    // Sprawdź czy plik istnieje
    try {
      await fs.access(entry.file_path)
    } catch {
      return new NextResponse('File not found', { status: 404 })
    }

    // Odczytaj plik
    const fileBuffer = await fs.readFile(entry.file_path)
    const fileName = path.basename(entry.file_path)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading file:', error)
    return new NextResponse('Download failed', { status: 500 })
  }
}
