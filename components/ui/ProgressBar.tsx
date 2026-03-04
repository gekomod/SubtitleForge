'use client'
import { useEffect, useState, useRef } from 'react'

interface Props { progress:number; current:number; total:number; elapsedTime:string; engine?:string }

const SPARK_COLS = 20

export default function ProgressBar({ progress, current, total, elapsedTime, engine }: Props) {
  const pct = Math.min(100, Math.max(0, progress || 0))
  const cur = current || 0
  const tot = total || 0

  const [bps, setBps]       = useState(0)
  const [hist, setHist]     = useState<{t:number;c:number}[]>([])
  const [spark, setSpark]   = useState<number[]>(Array(SPARK_COLS).fill(0))
  const bpsHistory = useRef<number[]>([])

  useEffect(() => {
    const now = Date.now()
    setHist(h => {
      const next = [...h.slice(-10), { t:now, c:cur }]
      if (next.length >= 2) {
        const dt = (next[next.length-1].t - next[0].t) / 1000
        const dc = next[next.length-1].c - next[0].c
        if (dt > 0) {
          const rate = dc / dt
          setBps(rate)
          bpsHistory.current = [...bpsHistory.current.slice(-SPARK_COLS+1), rate]
          const max = Math.max(...bpsHistory.current, 0.1)
          setSpark(
            Array(SPARK_COLS).fill(0).map((_,i) => {
              const v = bpsHistory.current[bpsHistory.current.length - SPARK_COLS + i]
              return v != null ? Math.max(5, (v/max)*100) : 0
            })
          )
        }
      }
      return next
    })
  }, [cur])

  const rem = tot - cur
  const eta = bps > 0 ? Math.ceil(rem / bps) : null
  const etaStr = eta != null
    ? eta > 3600 ? `>${Math.floor(eta/3600)}h`
    : eta > 60   ? `~${Math.floor(eta/60)}m ${eta%60}s`
    : `~${eta}s`
    : '—'

  const speedColor = bps > 2 ? 'var(--green)' : bps > 0.5 ? 'var(--amber)' : 'var(--muted)'

  return (
    <div className="relative bg-[var(--s2)] border border-[rgba(240,165,0,0.18)] rounded-[var(--rl)] overflow-hidden slide-in scanlines">
      {/* Animated border top */}
      <div className="h-0.5" style={{background:`linear-gradient(90deg, transparent, var(--amber) ${pct}%, rgba(240,165,0,0.1) ${pct}%, transparent)`}}></div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-3 border-b border-[var(--border)]">
        {/* Wave animation */}
        <div className="flex items-end gap-[2px] h-5 flex-shrink-0">
          {[60,100,70,100,50,85,65].map((h,i) => (
            <span key={i} className="wave-bar" style={{ height:`${h}%`, animationDelay:`${i*0.1}s` }}></span>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--amber)]">
              Tłumaczenie
            </span>
            {engine && (
              <span className="font-mono text-[10px] text-[var(--muted)] border border-[var(--border2)] px-1.5 py-0.5 rounded-full">
                {engine}
              </span>
            )}
          </div>
        </div>

        {/* Big percent */}
        <div className="flex-shrink-0 text-right">
          <div className="font-display text-4xl leading-none text-[var(--amber)]">
            {pct}<span className="text-xl text-[var(--amber)] opacity-60">%</span>
          </div>
        </div>
      </div>

      {/* Progress track */}
      <div className="px-4 pt-3 pb-1">
        {/* Segmented bar */}
        <div className="relative h-8 bg-[var(--s3)] rounded-lg overflow-hidden mb-3 border border-[var(--border)]">
          {/* Fill */}
          <div className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
            style={{width:`${pct}%`, background:'linear-gradient(90deg,rgba(240,165,0,0.15),rgba(240,165,0,0.28))'}}></div>
          {/* Sparkline bars */}
          <div className="absolute inset-0 flex items-end gap-px px-1 pb-1">
            {Array(24).fill(0).map((_,i) => {
              const active = (i/24*100) < pct
              const h = [40,70,55,90,65,80,45,100,60,75,50,85,70,55,80,45,95,60,72,48,88,63,77,52][i] || 50
              return (
                <div key={i} className="flex-1 rounded-sm transition-all duration-500"
                  style={{height:`${h}%`, background: active ? `rgba(240,165,0,${0.45+h/250})` : 'rgba(255,255,255,0.035)'}}></div>
              )
            })}
          </div>
          {/* Shimmer on active region */}
          {pct > 0 && pct < 100 && (
            <div className="absolute inset-y-0 left-0 shimmer pointer-events-none" style={{width:`${pct}%`}}></div>
          )}
          {/* Playhead */}
          {pct > 0 && pct < 100 && (
            <div className="absolute inset-y-0 w-px bg-[var(--amber)] opacity-80 transition-all duration-500"
              style={{left:`calc(${pct}% - 1px)`, boxShadow:'0 0 6px rgba(240,165,0,0.8)'}}></div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label:'Bloki', val: <>
                <span className="text-[var(--amber)]">{cur.toLocaleString()}</span>
                <span className="text-[var(--muted)] text-sm font-normal">/{tot.toLocaleString()}</span>
              </> },
            { label:'Upłynęło', val: <span className="text-[var(--text2)]">{elapsedTime}</span> },
            { label:'Pozostało', val: <span className="text-[var(--text2)]">{etaStr}</span> },
          ].map((s,i) => (
            <div key={i} className="bg-[var(--s3)] border border-[var(--border)] rounded-[10px] py-2 px-3 text-center">
              <div className="font-mono text-base font-semibold leading-none">{s.val}</div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-[var(--muted)] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Speed sparkline */}
        {bps > 0 && (
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-[10px] flex-shrink-0" style={{color:speedColor}}>
              {bps.toFixed(2)} bl/s
            </span>
            <div className="flex-1 flex items-end gap-px h-5">
              {spark.map((h,i) => (
                <div key={i} className="flex-1 rounded-sm transition-all duration-300"
                  style={{height:`${h}%`, background: h > 0 ? speedColor : 'rgba(255,255,255,0.05)', opacity: 0.5+i/SPARK_COLS*0.5}}></div>
              ))}
            </div>
            <span className="font-mono text-[9px] text-[var(--muted)] flex-shrink-0">szybkość</span>
          </div>
        )}
      </div>

      {/* Bottom accent */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent"></div>
    </div>
  )
}
