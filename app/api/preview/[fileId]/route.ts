import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { parseSRT, parseASS, parseVTT } from '@/lib/utils/subtitleParser'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
const TRANSLATED_DIR = process.env.TRANSLATED_DIR || path.join(process.cwd(), 'translated')

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const { fileId } = params

  try {
    // Search for file in uploads and translated folders
    let filepath: string | null = null
    
    const dirs = [UPLOAD_DIR, TRANSLATED_DIR]
    for (const dir of dirs) {
      const files = await fs.readdir(dir)
      const found = files.find(f => f.startsWith(fileId) || f.includes(fileId))
      if (found) {
        filepath = path.join(dir, found)
        break
      }
    }

    if (!filepath) {
      return NextResponse.json(
        { success: false, error: 'Nie znaleziono pliku' },
        { status: 404 }
      )
    }

    const content = await fs.readFile(filepath, 'utf-8')
    const ext = path.extname(filepath).toLowerCase()
    
    let blocks = []
    if (ext === '.ass' || ext === '.ssa') {
      blocks = parseASS(content)
    } else if (ext === '.vtt') {
      blocks = parseVTT(content)
    } else {
      blocks = parseSRT(content)
    }

    // Get first 10 lines for preview
    const preview = blocks.slice(0, 10).map(b => b.text)

    return NextResponse.json({
      success: true,
      preview,
      total_lines: blocks.length,
    })
  } catch (error) {
    console.error('Preview error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load preview' },
      { status: 500 }
    )
  }
}