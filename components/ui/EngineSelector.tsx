'use client'
import { useState, useEffect, useRef } from 'react'
interface EngineConfig { name:string; icon:string; iconColor?:string; iconBg?:string; description:string; enabled:boolean; popular?:boolean }
interface Props { engines:Record<string,EngineConfig>; selectedEngine:string|null; onSelect:(e:string)=>void; onOpenConfig:(e:string)=>void }
const COLORS: Record<string,{c:string;bg:string}> = {
  libretranslate:{c:'#60a5fa',bg:'rgba(96,165,250,.12)'}, googlegtx:{c:'#60a5fa',bg:'rgba(96,165,250,.12)'},
  ollama:{c:'#c084fc',bg:'rgba(192,132,252,.12)'},         deeplx:{c:'#f472b6',bg:'rgba(244,114,182,.12)'},
  deepseek:{c:'#22d3ee',bg:'rgba(34,211,238,.12)'},        openai:{c:'#fbbf24',bg:'rgba(251,191,36,.12)'},
  anthropic:{c:'#fb923c',bg:'rgba(251,146,60,.12)'},       azure:{c:'#38bdf8',bg:'rgba(56,189,248,.12)'},
  google:{c:'#4ade80',bg:'rgba(74,222,128,.12)'},           deepl:{c:'#a78bfa',bg:'rgba(167,139,250,.12)'},
  custom:{c:'#94a3b8',bg:'rgba(148,163,184,.12)'},
}
const gc = (k:string) => COLORS[k] || {c:'#94a3b8',bg:'rgba(148,163,184,.12)'}
export default function EngineSelector({ engines, selectedEngine, onSelect, onOpenConfig }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e:MouseEvent) => { if(ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown',h); return () => document.removeEventListener('mousedown',h)
  }, [])
  const sel = selectedEngine ? engines[selectedEngine] : null
  const colors = selectedEngine ? gc(selectedEngine) : null
  const enabled  = Object.entries(engines).filter(([,c])=>c.enabled)
  const disabled = Object.entries(engines).filter(([,c])=>!c.enabled)
  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <div onClick={() => setOpen(!open)}
        className={`bg-[var(--s2)] border rounded-[var(--rl)] p-3 cursor-pointer flex items-center gap-3 transition-all duration-200
          ${open ? 'border-[var(--border3)]' : 'border-[var(--border)] hover:border-[var(--border2)]'}`}>
        {sel && colors ? (
          <>
            <div className="w-9 h-9 flex-shrink-0 rounded-[11px] flex items-center justify-center text-base"
              style={{ background:colors.bg, color:colors.c }}><i className={`bi ${sel.icon}`}></i></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-[var(--text)]">{sel.name}</span>
                {sel.popular && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border"
                  style={{ color:colors.c, borderColor:`${colors.c}40`, background:colors.bg }}>★</span>}
              </div>
              <div className="text-[11px] text-[var(--muted)] truncate">{sel.description}</div>
            </div>
          </>
        ) : <div className="flex-1 text-sm text-[var(--muted)]">Wybierz silnik AI…</div>}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {selectedEngine && (
            <button onClick={e => { e.stopPropagation(); onOpenConfig(selectedEngine) }}
              className="w-7 h-7 rounded-lg bg-[var(--s3)] hover:bg-[var(--s4)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--amber)] flex items-center justify-center text-xs transition-all duration-150"
              title="Konfiguracja"><i className="bi bi-gear"></i></button>
          )}
          <i className={`bi bi-chevron-${open?'up':'down'} text-[var(--muted)] text-xs`}></i>
        </div>
      </div>
      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-[var(--s2)] border border-[var(--border2)] rounded-[var(--rl)] shadow-[0_20px_40px_-10px_rgba(0,0,0,.7)] overflow-hidden slide-in max-h-72 overflow-y-auto">
          {enabled.length > 0 && <>
            <div className="px-3 pt-2.5 pb-1 text-[9px] font-mono uppercase tracking-widest text-[var(--muted)] flex items-center gap-1.5 sticky top-0 bg-[var(--s2)]">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)]"></div>Aktywne ({enabled.length})
            </div>
            {enabled.map(([k,cfg]) => {
              const c = gc(k); const isSel = selectedEngine===k
              return (
                <div key={k} onClick={() => { onSelect(k); setOpen(false) }}
                  className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-all duration-150 ${isSel?'bg-[var(--s3)]':'hover:bg-[var(--s3)]'}`}>
                  <div className="w-7 h-7 rounded-[9px] flex items-center justify-center flex-shrink-0 text-xs"
                    style={{ background:c.bg, color:c.c }}><i className={`bi ${cfg.icon}`}></i></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-[var(--text)]">{cfg.name}</span>
                      {isSel && <i className="bi bi-check2 text-[var(--green)] text-xs ml-auto"></i>}
                    </div>
                    <div className="text-[10px] text-[var(--muted)] truncate">{cfg.description}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); onOpenConfig(k); setOpen(false) }}
                    className="w-6 h-6 rounded flex items-center justify-center text-[10px] text-[var(--muted)] hover:text-[var(--amber)] hover:bg-[var(--adim)] transition-all flex-shrink-0"
                    title="Konfiguracja"><i className="bi bi-gear"></i></button>
                </div>
              )
            })}
          </>}
          {disabled.length > 0 && <div className="border-t border-[var(--border)]">
            <div className="px-3 pt-2 pb-1 text-[9px] font-mono uppercase tracking-widest text-[var(--muted)] flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--dim)]"></div>Wyłączone ({disabled.length})
            </div>
            {disabled.map(([k,cfg]) => {
              const c = gc(k)
              return (
                <div key={k} onClick={() => { onOpenConfig(k); setOpen(false) }}
                  className="flex items-center gap-2.5 px-3 py-2 opacity-40 hover:opacity-65 cursor-pointer transition-opacity">
                  <div className="w-7 h-7 rounded-[9px] flex items-center justify-center flex-shrink-0 text-xs"
                    style={{ background:c.bg, color:c.c }}><i className={`bi ${cfg.icon}`}></i></div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-[var(--text2)]">{cfg.name}</span>
                  </div>
                  <span className="text-[9px] font-mono text-[var(--muted)] border border-[var(--border)] px-1.5 py-0.5 rounded-full flex-shrink-0">⚙ Włącz</span>
                </div>
              )
            })}
          </div>}
        </div>
      )}
    </div>
  )
}
