import { NextRequest, NextResponse } from 'next/server'
import { searchOpenSubtitles } from '@/lib/services/opensubtitles'

export async function POST(request: NextRequest) {
  try {
    const { query, target_lang, api_key } = await request.json()

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Brak zapytania' },
        { status: 400 }
      )
    }

    const results = await searchOpenSubtitles(query, target_lang, api_key)
    
    // Check if results is an error object
    if ('error' in results) {
      return NextResponse.json({
        success: true,
        results: [{ error: results.error }],
      })
    }

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
    })
  } catch (error) {
    console.error('OpenSubtitles search error:', error)
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    )
  }
}