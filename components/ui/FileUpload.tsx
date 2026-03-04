'use client'
import { useRef, useState, useCallback } from 'react'

const FMTS = [
  { ext:'SRT', c:'#f0a500', desc:'SubRip' },
  { ext:'ASS', c:'#5b9dff', desc:'Advanced SSA' },
  { ext:'VTT', c:'#00e585', desc:'WebVTT' },
  { ext:'SSA', c:'#b57bff', desc:'SubStation' },
]

export default function FileUpload({ onUpload, isUploading }: { onUpload:(f:File)=>void; isUploading:boolean }) {
  const ref  = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [cnt, setCnt]   = useState(0)

  const onEnter = useCallback((e:React.DragEvent) => { e.preventDefault(); setCnt(c=>c+1); setDrag(true) },[])
  const onLeave = useCallback((e:React.DragEvent) => { e.preventDefault(); setCnt(c=>{ const n=c-1; if(n<=0)setDrag(false); return Math.max(0,n) }) },[])
  const onOver  = useCallback((e:React.DragEvent) => e.preventDefault(),[])
  const onDrop  = useCallback((e:React.DragEvent) => {
    e.preventDefault(); setDrag(false); setCnt(0)
    const f = e.dataTransfer.files[0]; if(f) onUpload(f)
  },[onUpload])

  return (
    <div
      className={`relative rounded-[var(--rl)] overflow-hidden cursor-pointer select-none transition-all duration-300 group
        ${drag
          ? 'border-2 border-[var(--amber)] shadow-[0_0_40px_-10px_rgba(240,165,0,0.6)]'
          : 'border-2 border-dashed border-[var(--s5)] hover:border-[var(--border3)]'}`}
      onClick={() => !isUploading && ref.current?.click()}
      onDragEnter={onEnter} onDragLeave={onLeave} onDragOver={onOver} onDrop={onDrop}>

      {/* Film strip top */}
      <div className="h-5 bg-[var(--s3)] film-strip border-b border-[var(--border)] flex items-center px-3">
        <span className="font-mono text-[9px] text-[var(--muted)] tracking-widest uppercase">FRAME 001</span>
      </div>

      {/* Body */}
      <div className={`bg-[var(--s2)] grid-overlay py-8 px-6 text-center transition-all duration-300
        ${drag ? 'bg-[rgba(240,165,0,0.04)]' : ''}`}>

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 border-2 border-[var(--adim2)] rounded-full"></div>
              <div className="absolute inset-0 border-2 border-t-[var(--amber)] rounded-full spin-slow"></div>
              <div className="absolute inset-0 border border-[var(--adim)] rounded-full scale-75"></div>
              <i className="bi bi-film absolute inset-0 flex items-center justify-center text-[var(--amber)] text-xl"></i>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Analizowanie pliku…</p>
              <p className="font-mono text-[11px] text-[var(--muted)] mt-1">Wykrywanie języka i bloków</p>
            </div>
          </div>

        ) : drag ? (
          <div className="flex flex-col items-center gap-3 pop-in">
            <div className="w-14 h-14 rounded-2xl bg-[var(--adim2)] border border-[var(--amber)] flex items-center justify-center glow-amber glow-pulse">
              <i className="bi bi-box-arrow-in-down text-[var(--amber)] text-2xl"></i>
            </div>
            <p className="text-base font-bold text-[var(--amber)]">Upuść tutaj</p>
            <p className="font-mono text-[11px] text-[var(--muted)]">Obsługuję SRT · ASS · SSA · VTT</p>
          </div>

        ) : (
          <div className="flex flex-col items-center gap-4">
            {/* Upload icon */}
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 bg-[var(--s4)] border border-[var(--border2)] rounded-2xl group-hover:border-[var(--border3)] transition-all"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="bi bi-cloud-arrow-up text-[var(--text2)] group-hover:text-[var(--amber)] text-2xl transition-colors duration-200"></i>
              </div>
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--adim2)] rounded-tl-lg group-hover:border-[var(--adim3)] transition-colors"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--adim2)] rounded-tr-lg group-hover:border-[var(--adim3)] transition-colors"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[var(--adim2)] rounded-bl-lg group-hover:border-[var(--adim3)] transition-colors"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--adim2)] rounded-br-lg group-hover:border-[var(--adim3)] transition-colors"></div>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--amber)] transition-colors">
                Przeciągnij plik lub <span className="text-[var(--amber)]">wybierz</span>
              </p>
              <p className="font-mono text-[11px] text-[var(--muted)] mt-1">Maks. 100 MB · UTF-8, Windows-1250, ISO-8859</p>
            </div>

            {/* Format badges */}
            <div className="flex gap-2 flex-wrap justify-center">
              {FMTS.map(f => (
                <div key={f.ext} className="flex flex-col items-center gap-0.5">
                  <span className="font-mono text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all group-hover:scale-105"
                    style={{ color:f.c, borderColor:`${f.c}35`, background:`${f.c}0d` }}>
                    {f.ext}
                  </span>
                  <span className="font-mono text-[8px] text-[var(--muted)]">{f.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Film strip bottom */}
      <div className="h-5 bg-[var(--s3)] film-strip border-t border-[var(--border)] flex items-center justify-end px-3">
        <span className="font-mono text-[9px] text-[var(--muted)] tracking-widest uppercase">LOAD REEL</span>
      </div>

      <input ref={ref} type="file" accept=".srt,.ass,.ssa,.vtt"
        onChange={e => { const f=e.target.files?.[0]; if(f)onUpload(f); e.target.value='' }}
        className="hidden" />
    </div>
  )
}
