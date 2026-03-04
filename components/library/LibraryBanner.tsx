'use client'
import { useState, useEffect } from 'react'
interface Hit { id:number; target_lang:string; engine:string; blocks:number; created_at:number; download_url:string }
export default function LibraryBanner() {
  const [show, setShow] = useState(false)
  const [hits, setHits] = useState<Hit[]>([])
  const [single, setSingle] = useState<Hit|null>(null)
  useEffect(() => {
    const h = (e:any) => { const {hits:hs,single:s}=e.detail; setHits(hs); setSingle(s); setShow(true) }
    window.addEventListener('library-check',h as any)
    return () => window.removeEventListener('library-check',h as any)
  }, [])
  if (!show) return null
  const date = single ? new Date(single.created_at*1000).toLocaleDateString('pl-PL') : ''
  return (
    <div className="flex items-start gap-4 bg-[var(--gdim)] border border-[rgba(43,189,126,.25)] rounded-[var(--rl)] p-4 mb-4 pop-in">
      <div className="w-10 h-10 rounded-full bg-[var(--green)] flex items-center justify-center text-xl flex-shrink-0">🎉</div>
      <div className="flex-1 min-w-0">
        <h5 className="font-semibold text-sm text-[var(--green)] mb-1">
          {hits.length>1 ? `Ten tytuł jest w bibliotece w ${hits.length} językach!` : 'Ten tytuł jest już w bibliotece!'}
        </h5>
        {single && <p className="text-xs text-[var(--text2)]">{single.engine} · {single.blocks} bloków · {date}</p>}
        {hits.length>1 && (
          <div className="flex gap-2 flex-wrap mt-2">
            {hits.map(h=>(
              <a key={h.id} href={h.download_url}
                className="text-[var(--green)] border border-[rgba(43,189,126,.3)] bg-[var(--gdim)] text-xs px-3 py-1.5 rounded-lg no-underline font-semibold hover:bg-[rgba(43,189,126,.2)] transition-all">
                <i className="bi bi-download mr-1"></i>{h.target_lang.toUpperCase()}
              </a>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {single && hits.length===1 && (
          <a href={single.download_url} className="flex items-center gap-1.5 bg-[var(--green)] text-[#071a11] font-semibold text-xs px-4 py-2 rounded-xl no-underline hover:-translate-y-0.5 transition-all">
            <i className="bi bi-download"></i>Pobierz
          </a>
        )}
        <button onClick={()=>setShow(false)}
          className="border border-[var(--border2)] text-[var(--muted)] hover:text-[var(--text2)] text-xs px-3 py-2 rounded-xl transition-all">
          <i className="bi bi-x"></i>
        </button>
      </div>
    </div>
  )
}
