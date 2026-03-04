import { NextResponse } from 'next/server'
import { getRecent } from '@/lib/db/library'
import path from 'path'

export async function GET() {
  try {
    const rawResults = await getRecent(10)
    const results = rawResults.map((r: any) => ({
      ...r,
      download_url: r.file_path ? `/download/${encodeURIComponent(path.basename(r.file_path))}` : '',
    }))
    return NextResponse.json({ success: true, results })
  } catch (error) {
    return NextResponse.json({ success: false, results: [] })
  }
}
