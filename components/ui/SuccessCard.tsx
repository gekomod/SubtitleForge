'use client'
import { useEffect, useState } from 'react'

interface Props { blocks:number; elapsedTime:string; downloadUrl:string; onReset:()=>void }

const CONFETTI_COLORS = ['#f0a500','#00e585','#5b9dff','#ff4d5e','#b57bff','#ffbe40']

function Confetto({ x, color, delay, size }: { x:number; color:string; delay:number; size:number }) {
  return (
    <div className="absolute pointer-events-none" style={{
      left:`${x}%`, top:'-20px', width:`${size}px`, height:`${size}px`,
      background: color, borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      animation: `confetti-fall ${1.5 + Math.random()}s ${delay}s ease-in forwards`,
    }}/>
  )
}

export default function SuccessCard({ blocks, elapsedTime, downloadUrl, onReset }: Props) {
  const [confetti] = useState(() =>
    Array.from({length:30}, (_,i) => ({
      id:i, x: Math.random()*100,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random()*1.2,
      size: 4 + Math.random()*6,
    }))
  )
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(t)
  },[])

  return (
    <div className="relative bg-[var(--s2)] border border-[var(--gdim2)] rounded-[var(--rl)] overflow-hidden pop-in"
      style={{boxShadow:'0 0 40px -12px rgba(0,229,133,0.3)'}}>

      {/* Confetti layer */}
      {showConfetti && (
        <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
          {confetti.map(c => <Confetto key={c.id} {...c} />)}
        </div>
      )}

      {/* Top accent */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--green)] to-transparent"></div>

      {/* Content */}
      <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Success icon */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-[var(--green)] rounded-2xl opacity-15 blur-xl scale-150"></div>
          <div className="relative w-14 h-14 bg-[var(--gdim)] border border-[var(--gdim2)] rounded-2xl flex items-center justify-center glow-green">
            <i className="bi bi-check2-circle text-[var(--green)] text-2xl"></i>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-xl text-[var(--green)] tracking-wide">GOTOWE!</h3>
            <span className="font-mono text-[9px] border border-[var(--gdim2)] text-[var(--green)] px-2 py-0.5 rounded-full bg-[var(--gdim)]">
              ✓ SUCCESS
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-[var(--muted)] flex-wrap">
            <span><i className="bi bi-collection mr-1 text-[var(--amber)]"></i>{blocks.toLocaleString()} bloków</span>
            <span className="text-[var(--border2)]">·</span>
            <span><i className="bi bi-clock mr-1 text-[var(--amber)]"></i>{elapsedTime}</span>
            <span className="text-[var(--border2)]">·</span>
            <span className="text-[var(--green)] opacity-70">
              {blocks > 0 && elapsedTime ? `~${(blocks/Math.max(1, parseInt(elapsedTime.split(':')[1]||'1'))).toFixed(0)} bl/min` : ''}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
          <a href={downloadUrl} download
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--rl)] font-semibold text-sm text-[#0a0e00] transition-all duration-200 hover:-translate-y-0.5"
            style={{background:'var(--green)', boxShadow:'0 6px 20px -6px rgba(0,229,133,0.55)'}}>
            <i className="bi bi-download"></i>
            Pobierz
          </a>
          <button onClick={onReset}
            className="px-4 py-2.5 rounded-[var(--rl)] text-sm font-medium text-[var(--muted)] border border-[var(--border)] hover:border-[var(--border2)] hover:text-[var(--text2)] transition-all duration-200 flex-shrink-0">
            <i className="bi bi-plus mr-1.5"></i>Nowy
          </button>
        </div>
      </div>

      {/* Bottom accent */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--gdim2)] to-transparent"></div>
    </div>
  )
}
