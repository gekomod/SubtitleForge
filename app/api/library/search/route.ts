import { NextRequest, NextResponse } from 'next/server'
import { searchLibrary, getRecent } from '@/lib/db/library'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || ''
  const lang = searchParams.get('lang') || ''

  try {
    if (!query.trim()) {
      const items = await getRecent(20)
      return NextResponse.json({ success: true, results: items })
    }

    const results = await searchLibrary(query, lang, 50) // Zwiększamy limit do 50
    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Error searching library:', error)
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    )
  }
}