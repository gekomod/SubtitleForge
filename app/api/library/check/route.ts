import { NextRequest, NextResponse } from 'next/server'

// In-memory library
let library: any[] = []

export async function POST(request: NextRequest) {
  try {
    const { filename, target_lang } = await request.json()
    
    if (!filename) {
      return NextResponse.json({ success: true, found: false })
    }

    const existing = library.find(item => 
      item.orig_filename === filename && 
      item.target_lang === (target_lang || 'pl')
    )
    
    if (existing) {
      return NextResponse.json({
        success: true,
        found: true,
        entry: {
          id: existing.id,
          norm_title: existing.norm_title,
          engine: existing.engine,
          target_lang: existing.target_lang,
          blocks: existing.blocks,
          created_at: existing.created_at,
          download_url: `/library/download/${existing.id}`,
        }
      })
    }

    return NextResponse.json({ success: true, found: false })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Check failed' },
      { status: 500 }
    )
  }
}