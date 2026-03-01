import { NextRequest, NextResponse } from 'next/server'

// In-memory library (tymczasowo)
let library: any[] = []

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || ''
  const lang = searchParams.get('lang') || ''

  if (!query.trim()) {
    return NextResponse.json({ 
      success: true, 
      results: library.slice(0, 20) 
    })
  }

  const results = library.filter(item => 
    (item.norm_title?.toLowerCase().includes(query.toLowerCase()) ||
     item.orig_filename?.toLowerCase().includes(query.toLowerCase())) &&
    (lang ? item.target_lang === lang : true)
  ).slice(0, 30)

  return NextResponse.json({ success: true, results })
}