import { NextResponse } from 'next/server'

// In-memory library
let library: any[] = []

export async function GET() {
  const items = library.slice(0, 12)
  return NextResponse.json({ success: true, results: items })
}