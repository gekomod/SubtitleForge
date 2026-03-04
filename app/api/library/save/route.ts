import { NextRequest, NextResponse } from 'next/server'
import { saveToLibrary } from '@/lib/db/library'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { orig_filename, output_filename, engine, source_lang, target_lang, blocks } = await request.json()

    if (!orig_filename && !output_filename) {
      return NextResponse.json({ success: false, error: 'Brak nazwy pliku' }, { status: 400 })
    }

    // Use original filename if available, else extract from output (remove UUID prefix)
    let displayFilename = orig_filename || output_filename
    // Strip UUID prefix: "f636f6e8-..._filename.srt" → "filename.srt"
    const uuidMatch = displayFilename.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_(.+)$/i)
    if (uuidMatch) displayFilename = uuidMatch[1]

    const outputDir = path.join(process.cwd(), 'translated')
    const filePath = path.join(outputDir, output_filename || orig_filename)

    const id = saveToLibrary(
      displayFilename,
      filePath,
      engine || 'unknown',
      source_lang || 'auto',
      target_lang || 'pl',
      blocks || 0
    )

    return NextResponse.json({ success: true, library_id: id })
  } catch (error) {
    console.error('Error saving to library:', error)
    return NextResponse.json({ success: false, error: 'Save failed' }, { status: 500 })
  }
}
