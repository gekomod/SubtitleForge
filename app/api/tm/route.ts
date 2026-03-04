import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const TM_PATH = path.join(process.cwd(), 'data', 'translation_memory.json')

async function readTM() {
  try { return JSON.parse(await fs.readFile(TM_PATH, 'utf-8')) }
  catch { return [] }
}

export async function GET() {
  return NextResponse.json({ success: true, entries: await readTM() })
}

export async function POST(request: NextRequest) {
  const { entries } = await request.json()
  await fs.mkdir(path.dirname(TM_PATH), { recursive: true })
  await fs.writeFile(TM_PATH, JSON.stringify(entries, null, 2), 'utf-8')
  return NextResponse.json({ success: true })
}
