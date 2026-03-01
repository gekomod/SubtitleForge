import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { countBlocks } from '@/lib/utils/subtitleParser'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params

    const files = await fs.readdir(UPLOAD_DIR)
    const filename = files.find(f => f.startsWith(fileId))
    
    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Nie znaleziono pliku' },
        { status: 404 }
      )
    }

    const filepath = path.join(UPLOAD_DIR, filename)
    const stats = await fs.stat(filepath)
    const ext = path.extname(filename).toLowerCase()
    const fmt = ext === '.ass' || ext === '.ssa' ? 'ass' : ext === '.vtt' ? 'vtt' : 'srt'
    
    const content = await fs.readFile(filepath, 'utf-8')
    const blocks = countBlocks(content, fmt)
    const totalChars = content.replace(/\s+/g, '').length
    const est = Math.ceil(blocks * 0.5)

    return NextResponse.json({
      success: true,
      filename,
      file_type: ext,
      size: stats.size,
      size_mb: (stats.size / (1024 * 1024)).toFixed(2),
      blocks,
      total_chars: totalChars,
      estimated_time: est,
      estimated_time_str: est >= 60 ? `${Math.floor(est / 60)}m ${est % 60}s` : `${est}s`,
    })
  } catch (error) {
    console.error('Error getting file details:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get file details' },
      { status: 500 }
    )
  }
}