'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface StatsData {
  total_entries: number
  total_hits: number
  total_size_mb: string
  by_engine: Array<{engine:string;count:number;total_hits:number}>
}

interface Props {
  embedded?: boolean  // if true: always expanded, no dropdown wrapper
}

export default function CacheStats({ embedded = false }: Props) {
  const [stats,  setStats]   = useState<StatsData|null>(null)
  const [open,   setOpen]    = useState(false)
  const [purging,setPurging] = useState(false)

  useEffect(() => { loadStats() }, [])

  const loadStats = async () => {
    try {
      const d = await fetch('/api/cache/stats').then(r=>r.json())
      if (d.success) setStats(d.stats)
    } catch {}
  }

  const purge = async (days: number) => {
    setPurging(true)
    try {
      const d = await fetch('/api/cache/purge', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ days })
      }).then(r=>r.json())
      if (d.success) {
        toast.success(`Usunięto ${d.deleted} wpisów${days>0?` starszych niż ${days} dni`:''}`)
        await loadStats()
      }
    } catch { toast.error('Błąd czyszczenia') }
    setPurging(false)
    if (!embedded) setOpen(false)
  }

  const purgeAll = async () => {
    if (!confirm('Wyczyścić cały cache tłumaczeń?')) return
    await purge(0)
  }

  const isEmpty = !stats || stats.total_entries === 0

  // ── Embedded (inline in TranslateTab right column) ─────────────────────
  if (embedded) {
    if (isEmpty) return (
      <div className="py-3 text-center font-mono text-[10px] text-[var(--muted)]">
        <i className="bi bi-lightning-charge block text-xl opacity-20 mb-1"></i>
        Cache pusty — pierwsze tłumaczenie wypełni go automatycznie
      </div>
    )
    return (
      <div className="pt-3 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:'Wpisy',    value: stats!.total_entries,    color:'var(--amber)' },
            { label:'Użycia',   value: stats!.total_hits,       color:'var(--green)' },
            { label:'Rozmiar',  value: stats!.total_size_mb+'MB', color:'var(--blue)' },
          ].map(s => (
            <div key={s.label} className="bg-[var(--s3)] border border-[var(--border)] rounded-lg p-2 text-center">
              <div className="font-display text-sm" style={{color:s.color}}>{s.value}</div>
              <div className="font-mono text-[9px] text-[var(--muted)]">{s.label}</div>
            </div>
          ))}
        </div>

        {stats!.by_engine?.length > 0 && (
          <div className="space-y-1">
            {stats!.by_engine.map(e => {
              const maxC = Math.max(...stats!.by_engine.map(x=>x.count),1)
              return (
                <div key={e.engine} className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[var(--text2)] w-20 truncate">{e.engine}</span>
                  <div className="flex-1 h-1.5 bg-[var(--s4)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--amber)] rounded-full" style={{width:`${e.count/maxC*100}%`}}/>
                  </div>
                  <span className="font-mono text-[10px] text-[var(--muted)] w-5 text-right">{e.count}</span>
                </div>
              )
            })}
          </div>
        )}

        <div className="space-y-1 pt-1 border-t border-[var(--border)]">
          <div className="font-mono text-[9px] text-[var(--muted)] uppercase tracking-wider mb-1.5">Czyszczenie</div>
          {[{label:'Starsze niż 7 dni',days:7},{label:'Starsze niż 30 dni',days:30}].map(opt=>(
            <button key={opt.days} onClick={()=>purge(opt.days)} disabled={purging}
              className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[var(--text2)] hover:bg-[var(--s3)] border border-[var(--border)] transition-all disabled:opacity-50">
              <i className="bi bi-clock-history text-[var(--muted)] text-[10px]"></i>{opt.label}
            </button>
          ))}
          <button onClick={purgeAll} disabled={purging}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[var(--red)] hover:bg-[var(--rdim)] border border-[rgba(255,77,94,.25)] transition-all disabled:opacity-50">
            <i className="bi bi-trash text-[10px]"></i>
            Wyczyść cały cache ({stats!.total_entries} wpisów)
          </button>
        </div>
      </div>
    )
  }

  // ── Floating pill (used in page.tsx header bar) ─────────────────────────
  if (isEmpty) return null

  return (
    <div className="relative">
      <button onClick={()=>setOpen(!open)}
        className="flex items-center gap-2 bg-[var(--s2)] border border-[var(--border)] hover:border-[var(--border2)] rounded-full px-3 py-1.5 text-[10px] font-mono transition-all">
        <i className="bi bi-lightning-charge text-[var(--amber)]"></i>
        <span className="text-[var(--text2)]">Cache: <span className="text-[var(--amber)]">{stats!.total_entries}</span></span>
        <span className="text-[var(--muted)]">· {stats!.total_size_mb} MB</span>
        <i className={`bi bi-chevron-${open?'up':'down'} text-[var(--muted)] text-[9px]`}></i>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[var(--s2)] border border-[var(--border2)] rounded-[var(--rl)] shadow-2xl z-30 overflow-hidden fade-in">
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--amber)] to-transparent opacity-30"></div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] text-[var(--muted)] uppercase tracking-wider">Cache tłumaczeń</span>
              <button onClick={()=>setOpen(false)} className="text-[var(--muted)] hover:text-[var(--text2)] text-xs"><i className="bi bi-x"></i></button>
            </div>
            <CacheStats embedded />
          </div>
        </div>
      )}
    </div>
  )
}
