import { NextRequest, NextResponse } from 'next/server'

// In-memory library
let library: any[] = []
let nextId = 1

export async function POST(request: NextRequest) {
  try {
    const { task_id, engine, source_lang, target_lang, blocks } = await request.json()
    
    if (!task_id) {
      return NextResponse.json(
        { success: false, error: 'Brak task_id' },
        { status: 400 }
      )
    }

    const newEntry = {
      id: nextId++,
      uuid: task_id,
      orig_filename: `translated_${Date.now()}.srt`,
      norm_title: 'translated',
      file_path: '',
      engine: engine || 'unknown',
      source_lang: source_lang || 'auto',
      target_lang: target_lang || 'pl',
      blocks: blocks || 0,
      created_at: Math.floor(Date.now() / 1000)
    }

    library.push(newEntry)

    return NextResponse.json({ success: true, library_id: newEntry.id })
  } catch (error) {
    console.error('Error saving to library:', error)
    return NextResponse.json(
      { success: false, error: 'Save failed' },
      { status: 500 }
    )
  }
}