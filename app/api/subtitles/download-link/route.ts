import { NextRequest, NextResponse } from 'next/server'
import { getDownloadLink } from '@/lib/services/opensubtitles'

export async function POST(request: NextRequest) {
  try {
    const { file_id, api_key } = await request.json()
    
    if (!file_id) {
      return NextResponse.json(
        { success: false, error: 'Brak file_id' },
        { status: 400 }
      )
    }

    const link = await getDownloadLink(file_id, api_key)
    
    if (link) {
      return NextResponse.json({ success: true, link })
    }

    return NextResponse.json({
      success: false,
      error: 'Nie udało się pobrać linku. Wymagane konto OpenSubtitles.',
    })
  } catch (error) {
    console.error('Error getting download link:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get download link' },
      { status: 500 }
    )
  }
}