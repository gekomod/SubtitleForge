import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { fileExists } from '@/lib/services/fileService'

const TRANSLATED_DIR = process.env.TRANSLATED_DIR || path.join(process.cwd(), 'translated')

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  const { filename } = params

  // Security: prevent path traversal
  const safeName = path.basename(filename)
  const filepath = path.join(TRANSLATED_DIR, safeName)

  try {
    if (!await fileExists(filepath)) {
      return new NextResponse('File not found', { status: 404 })
    }

    const fileBuffer = await fs.readFile(filepath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Content-Type': 'application/octet-stream',
      },
    })
  } catch (error) {
    console.error('Error downloading file:', error)
    return new NextResponse('Download failed', { status: 500 })
  }
}