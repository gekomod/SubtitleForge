import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getFileInfo } from '@/lib/services/fileService'
import { countBlocks } from '@/lib/utils/subtitleParser'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')

export async function POST(request: NextRequest) {
  try {
    // This endpoint expects a file_id in the request
    // In a real implementation, you'd get this from a cookie/session
    // For now, we'll assume the client sends it
    const { file_id } = await request.json()
    
    if (!file_id) {
      return NextResponse.json(
        { success: false, error: 'Brak pliku' },
        { status: 400 }
      )
    }

    const files = await fs.readdir(UPLOAD_DIR)
    const filename = files.find(f => f.startsWith(file_id))
    
    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Plik nie istnieje' },
        { status: 404 }
      )
    }

    const filepath = path.join(UPLOAD_DIR, filename)
    const stats = await fs.stat(filepath)
    const ext = path.extname(filename).toLowerCase()
    const fmt = ext === '.ass' || ext === '.ssa' ? 'ass' : ext === '.vtt' ? 'vtt' : 'srt'
    
    const content = await fs.readFile(filepath, 'utf-8')
    const blocks = countBlocks(content, fmt)
    const linesCount = content.split('\n').length

    return NextResponse.json({
      success: true,
      filename: filename.substring(filename.indexOf('_') + 1),
      file_type: fmt.toUpperCase(),
      size: stats.size,
      blocks,
      lines: linesCount,
      detected_lang: 'en', // This would need to be stored from upload
    })
  } catch (error) {
    console.error('Error getting file info:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get file info' },
      { status: 500 }
    )
  }
}