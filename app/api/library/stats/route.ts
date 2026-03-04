import { NextResponse } from 'next/server'
import { getRecent } from '@/lib/db/library'
import path from 'path'

export async function GET() {
  try {
    const all = await getRecent(1000)
    const totalBlocks = all.reduce((s:number,r:any) => s+(r.blocks||0), 0)
    const byEngine: Record<string,number> = {}
    const byLang:   Record<string,number> = {}
    const byDate:   Record<string,number> = {}
    for (const r of all) {
      byEngine[r.engine] = (byEngine[r.engine]||0) + 1
      byLang[r.target_lang] = (byLang[r.target_lang]||0) + 1
      const day = new Date(r.created_at*1000).toISOString().slice(0,10)
      byDate[day] = (byDate[day]||0) + 1
    }
    return NextResponse.json({ success:true, total:all.length, totalBlocks, byEngine, byLang, byDate })
  } catch {
    return NextResponse.json({ success:false, error:'Stats failed' }, { status:500 })
  }
}
