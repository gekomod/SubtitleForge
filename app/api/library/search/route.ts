import { NextRequest, NextResponse } from 'next/server'
import { searchLibrary, getRecent } from '@/lib/db/library'
import path from 'path'

function buildDownloadUrl(entry: any): string {
  // file_path is absolute path like /home/.../translated/UUID_name.pl.srt
  // Extract just the filename for the download URL
  const filename = path.basename(entry.file_path || entry.orig_filename || '')
  return filename ? `/download/${encodeURIComponent(filename)}` : ''
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || ''
  const lang  = searchParams.get('lang') || ''

  try {
    const rawResults = query.trim()
      ? await searchLibrary(query, lang, 50)
      : await getRecent(20)

    // Add download_url to each result
    const results = rawResults.map((r: any) => ({
      ...r,
      download_url: buildDownloadUrl(r),
    }))

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Error searching library:', error)
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 })
  }
}
