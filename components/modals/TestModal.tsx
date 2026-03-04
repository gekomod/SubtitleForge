'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
interface Props { isOpen:boolean; onClose:()=>void; result?:{success:boolean;message:string}|null; isLoading:boolean }
export default function TestModal({ isOpen, onClose, result, isLoading }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true); return ()=>setMounted(false) }, [])
  if (!isOpen || !mounted) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-[var(--s2)] border border-[var(--border2)] rounded-[var(--rxl)] w-full max-w-sm shadow-[0_30px_60px_-15px_rgba(0,0,0,.7)] pop-in">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
          <span className="text-sm font-semibold text-[var(--text2)]">Test połączenia</span>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-[var(--s3)] hover:bg-[var(--s4)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] flex items-center justify-center text-sm transition-all">
            <i className="bi bi-x"></i>
          </button>
        </div>
        <div className="p-6 text-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-end gap-0.5 h-8">
                {[60,100,75,100,55].map((h,i) => (
                  <span key={i} className="wave-bar" style={{ height:`${h}%`, animationDelay:`${i*.12}s` }}></span>
                ))}
              </div>
              <p className="text-sm text-[var(--text2)]">Testowanie połączenia…</p>
            </div>
          ) : result ? (
            <div className="flex flex-col items-center gap-3">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center border ${result.success
                ? 'bg-[var(--gdim)] border-[rgba(43,189,126,.3)] glow-green' : 'bg-[var(--rdim)] border-[rgba(230,57,70,.3)] glow-red'}`}>
                <i className={`bi ${result.success ? 'bi-check-lg text-[var(--green)]' : 'bi-x-lg text-[var(--red)]'} text-2xl`}></i>
              </div>
              <p className={`text-sm font-mono whitespace-pre-wrap text-left w-full ${result.success ? 'text-[var(--green)]' : 'text-[var(--text2)]'}`}>
                {result.message}
              </p>
              <button onClick={onClose}
                className="mt-2 px-6 py-2 bg-[var(--s3)] hover:bg-[var(--s4)] border border-[var(--border2)] text-[var(--text2)] rounded-xl text-sm font-medium transition-all">
                Zamknij
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>, document.body
  )
}
