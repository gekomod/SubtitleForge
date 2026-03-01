import { NextResponse } from 'next/server'

export async function POST() {
  // In Next.js App Router, we don't have session like in Flask
  // This is handled client-side via Zustand store
  // This endpoint exists for backward compatibility
  
  return NextResponse.json({ success: true })
}