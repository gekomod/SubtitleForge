import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const TRANSLATED_DIR = path.join(process.cwd(), 'translated')

export async function POST(request: NextRequest) {
  try {
    const { filename, edits } = await request.json()
    if (!filename || !Array.isArray(edits)) {
      return NextResponse.json({ success: false, error: 'Brak danych' }, { status: 400 })
    }
    const safeName = path.basename(filename)
    const filepath = path.join(TRANSLATED_DIR, safeName)
    let content: string
    try { content = await fs.readFile(filepath, 'utf-8') }
    catch { return NextResponse.json({ success: false, error: 'Plik nie istnieje' }, { status: 404 }) }

    const ext = path.extname(safeName).toLowerCase()
    const editMap = new Map(edits.map((e: {blockIndex:number;text:string}) => [e.blockIndex, e.text]))
    let updated = content

    if (ext === '.srt') {
      const norm = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      const blocks = norm.split(/\n\n+/)
      const newBlocks = blocks.map((block: string, i: number) => {
        if (!editMap.has(i)) return block
        const lines = block.split('\n')
        return lines.length >= 2 ? [lines[0], lines[1], ...editMap.get(i)!.split('\n')].join('\n') : block
      })
      updated = newBlocks.join('\n\n')
    } else if (ext === '.ass' || ext === '.ssa') {
      let idx = 0
      updated = content.split('\n').map((line: string) => {
        if (!line.startsWith('Dialogue:')) return line
        const i = idx++
        if (!editMap.has(i)) return line
        const parts = line.split(',')
        return parts.length >= 10 ? parts.slice(0,9).join(',') + ',' + editMap.get(i)! : line
      }).join('\n')
    } else if (ext === '.vtt') {
      let idx = 0
      updated = content.replace(/\r\n/g,'\n').split(/\n\n+/).map((block: string) => {
        if (!block.includes('-->')) return block
        const i = idx++
        if (!editMap.has(i)) return block
        const lines = block.split('\n')
        const ts = lines.findIndex((l: string) => l.includes('-->'))
        return ts >= 0 ? [...lines.slice(0,ts+1), ...editMap.get(i)!.split('\n')].join('\n') : block
      }).join('\n\n')
    }

    await fs.writeFile(filepath, updated, 'utf-8')
    return NextResponse.json({ success: true, saved: edits.length })
  } catch (err) {
    console.error('edit-save:', err)
    return NextResponse.json({ success: false, error: 'Błąd zapisu' }, { status: 500 })
  }
}
