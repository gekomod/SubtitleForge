import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const TRANSLATED_DIR = process.env.TRANSLATED_DIR || path.join(process.cwd(), 'translated')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params

    // Zabezpieczenie przed path traversal
    const safeName = path.basename(filename)
    const filepath = path.join(TRANSLATED_DIR, safeName)

    console.log('Attempting to download file:', filepath)

    // Sprawdź czy plik istnieje
    try {
      await fs.access(filepath)
    } catch {
      console.error('File not found:', filepath)
      return new NextResponse('File not found', { status: 404 })
    }

    // Odczytaj plik
    const fileBuffer = await fs.readFile(filepath)
    const ext = path.extname(filepath).toLowerCase()
    const stats = await fs.stat(filepath)
    
    console.log('File found, size:', stats.size, 'bytes')
    
    // Określ typ MIME
    const mimeTypes: Record<string, string> = {
      '.srt': 'text/plain',
      '.ass': 'text/plain',
      '.ssa': 'text/plain',
      '.vtt': 'text/vtt',
    }
    
    const contentType = mimeTypes[ext] || 'application/octet-stream'

    // Przygotuj nazwę do pobrania (usuń prefix UUID jeśli istnieje)
    let downloadName = safeName
    if (downloadName.includes('_')) {
      // Format: UUID_originalna_nazwa
      const parts = downloadName.split('_')
      if (parts.length > 1) {
        downloadName = parts.slice(1).join('_')
      }
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Error downloading file:', error)
    return new NextResponse('Download failed', { status: 500 })
  }
}