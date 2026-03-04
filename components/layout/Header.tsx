'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/components/providers/ThemeProvider'

interface HeaderProps { totalTranslations: number }

const STATUS_MESSAGES = [
  '11 silników AI', 'SRT · ASS · SSA · VTT', 'Auto-detect języka',
  'Podgląd na żywo', 'Batch processing', 'Local + Cloud engines',
]

export default function Header({ totalTranslations }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const [time, setTime]     = useState('')
  const [msgIdx, setMsgIdx] = useState(0)
  const [fadeMsg, setFadeMsg] = useState(true)

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit',second:'2-digit'}))
    tick(); const id = setInterval(tick,1000); return () => clearInterval(id)
  },[])

  useEffect(() => {
    const id = setInterval(() => {
      setFadeMsg(false)
      setTimeout(() => { setMsgIdx(i => (i+1) % STATUS_MESSAGES.length); setFadeMsg(true) }, 250)
    }, 3000)
    return () => clearInterval(id)
  },[])

  return (
    <header className="mb-6 slide-up">
      {/* Ticker */}
      <div className="flex items-center gap-2 mb-4 overflow-hidden">
        <span className="font-mono text-[9px] tracking-widest uppercase text-[var(--muted)] border border-[var(--border)] px-2 py-0.5 rounded flex-shrink-0 bg-[var(--s2)]">
          LIVE
        </span>
        <div className="flex-1 overflow-hidden relative h-5">
          <div className="ticker whitespace-nowrap font-mono text-[10px] text-[var(--muted)] flex items-center gap-8">
            {[...STATUS_MESSAGES,...STATUS_MESSAGES].map((m,i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[var(--amber)] opacity-60 flex-shrink-0"></span>
                {m}
              </span>
            ))}
          </div>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-[var(--border2)] to-transparent hidden sm:block"></div>
      </div>

      <div className="flex items-end justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-[var(--amber)] rounded-2xl opacity-[0.08] blur-2xl scale-[1.8]"></div>
            <div className="relative w-14 h-14 bg-[var(--s2)] border border-[var(--border2)] rounded-2xl flex flex-col items-center justify-between py-2 overflow-hidden"
              style={{boxShadow:'inset 0 1px 0 rgba(255,255,255,0.06)'}}>
              <div className="flex gap-2">
                {[0,1,2].map(i=><div key={i} className="w-1.5 h-1 bg-[var(--s5)] rounded-sm"/>)}
              </div>
              <i className="bi bi-translate text-[var(--amber)] text-xl leading-none"></i>
              <div className="flex gap-2">
                {[0,1,2].map(i=><div key={i} className="w-1.5 h-1 bg-[var(--s5)] rounded-sm"/>)}
              </div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.12)] to-transparent"></div>
            </div>
          </div>

          <div>
            <h1 className="font-display leading-none tracking-tight text-[2.6rem] sm:text-[3.2rem]">
              SUBTITLE<span className="text-[var(--amber)]">FORGE</span>
            </h1>
            <p className="font-mono text-[10px] text-[var(--muted)] tracking-[.18em] uppercase mt-0.5 flex items-center gap-2">
              <span className="w-3 h-px bg-[var(--amber)] opacity-50"></span>
              AI Subtitle Translation Studio
              <span className="w-3 h-px bg-[var(--amber)] opacity-50"></span>
            </p>
          </div>
        </div>

        {/* Right badges */}
        <div className="flex items-center gap-2 pb-0.5 flex-shrink-0">
          {/* Rotating status */}
          <div className="hidden md:flex items-center gap-2 border border-[var(--border)] bg-[var(--s2)] rounded-full px-3 py-1.5 min-w-[130px] justify-center">
            <span className="font-mono text-[10px] text-[var(--text2)] transition-opacity duration-200"
              style={{opacity: fadeMsg ? 1 : 0}}>
              {STATUS_MESSAGES[msgIdx]}
            </span>
          </div>

          {/* Clock */}
          {time && (
            <div className="hidden sm:flex items-center gap-1.5 bg-[var(--s2)] border border-[var(--border)] rounded-full px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)] pulse-dot flex-shrink-0"></div>
              <span className="font-mono text-[11px] text-[var(--muted)]">{time}</span>
            </div>
          )}

          {/* Count */}
          <div className="bg-[var(--adim)] border border-[var(--adim2)] rounded-full px-3 py-1.5 flex items-center gap-2">
            <i className="bi bi-film text-[var(--amber)] text-xs flex-shrink-0"></i>
            <span className="font-mono text-[11px]">
              <span className="text-[var(--amber)] font-semibold">{totalTranslations}</span>
              <span className="text-[var(--muted)] ml-1">tłum.</span>
            </span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Tryb jasny' : 'Tryb ciemny'}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--s2)] text-[var(--muted)] hover:text-[var(--amber)] hover:border-[var(--adim2)] transition-all duration-200 flex-shrink-0">
            <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'} text-sm`}></i>
          </button>
        </div>
      </div>

      {/* Separator */}
      <div className="mt-4 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full border border-[var(--amber)] opacity-40 flex-shrink-0"></div>
        <div className="flex-1 h-px bg-gradient-to-r from-[var(--adim2)] via-[var(--border)] to-transparent"></div>
        <span className="font-mono text-[9px] text-[var(--muted)] tracking-widest">v2.0</span>
      </div>
    </header>
  )
}
