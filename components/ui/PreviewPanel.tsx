'use client'
const esc = (s:string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
const clip = (s:string, n=100) => s.length > n ? esc(s.slice(0,n))+'…' : esc(s)
const VIEWS = [
  { id:'original'  as const, icon:'bi-file-text',       label:'Oryginał' },
  { id:'translated'as const, icon:'bi-file-earmark-check', label:'Tłumaczenie' },
  { id:'sidebyside'as const, icon:'bi-layout-split',    label:'Obok siebie' },
]
interface PreviewPanelProps {
  previewData:string[]; type:'original'|'translated'|'sidebyside'
  originalData?:string[]; translatedData?:string[]
  onTypeChange?:(t:'original'|'translated'|'sidebyside')=>void
  showToggle?:boolean; isLive?:boolean
}
export default function PreviewPanel({ previewData=[], type, originalData=[], translatedData=[], onTypeChange, showToggle=false, isLive=false }: PreviewPanelProps) {
  const Line = ({ text, idx, dim=false }:{ text:string; idx:number; dim?:boolean }) => (
    <div className="flex gap-2 py-1.5 border-b border-[var(--border)] last:border-0">
      <span className="font-mono text-[10px] w-5 text-right flex-shrink-0 text-[var(--muted)] mt-0.5">{idx+1}</span>
      <span className={`font-mono text-[11px] leading-relaxed flex-1 min-w-0 break-words ${dim ? 'text-[var(--text2)]' : 'text-[var(--text)]'}`}
        dangerouslySetInnerHTML={{ __html: clip(text) }} />
    </div>
  )
  const Pending = ({ idx }:{ idx:number }) => (
    <div className="flex gap-2 py-1.5 border-b border-[var(--border)] last:border-0">
      <span className="font-mono text-[10px] w-5 text-right flex-shrink-0 text-[var(--muted)] mt-0.5">{idx+1}</span>
      <span className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--muted)] italic">
        <span className="w-2.5 h-2.5 border border-[var(--amber)] border-t-transparent rounded-full animate-spin flex-shrink-0"></span>czeka…
      </span>
    </div>
  )
  const renderContent = () => {
    if (type === 'sidebyside') {
      const len = Math.max(originalData.length, translatedData.length, 1)
      return (
        <div className="grid grid-cols-2 divide-x divide-[var(--border)]">
          <div className="pr-2">
            <div className="text-[9px] font-mono uppercase tracking-widest text-[var(--muted)] mb-2 flex items-center gap-1">
              <i className="bi bi-file-text"></i>Original
            </div>
            {originalData.map((t,i) => <Line key={i} text={t} idx={i} dim />)}
          </div>
          <div className="pl-2">
            <div className="text-[9px] font-mono uppercase tracking-widest text-[var(--muted)] mb-2 flex items-center gap-1">
              {isLive && <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] pulse-dot"></span>}
              <i className="bi bi-file-earmark-check"></i>{isLive ? 'Live' : 'Tłumaczenie'}
            </div>
            {Array.from({length:len}).map((_,i) => {
              const t = translatedData[i]
              if (!t && isLive) return <Pending key={i} idx={i} />
              return t ? <Line key={i} text={t} idx={i} /> : null
            })}
          </div>
        </div>
      )
    }
    const data = type === 'original' ? (previewData.length ? previewData : originalData) : translatedData
    if (!data.length) return (
      <div className="py-6 text-center font-mono text-xs text-[var(--muted)]">
        <i className="bi bi-eye-slash block text-2xl mb-2 opacity-30"></i>Brak podglądu
      </div>
    )
    return data.slice(0,10).map((t,i) => <Line key={i} text={t} idx={i} dim={type==='original'} />)
  }
  return (
    <div className="bg-[var(--s2)] border border-[var(--border)] rounded-[var(--rl)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--s3)]">
        <div className="flex items-center gap-2">
          <i className="bi bi-eye text-[var(--amber)] text-xs"></i>
          <span className="text-[11px] font-semibold text-[var(--text2)]">Podgląd</span>
          {isLive && <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--amber)] bg-[var(--adim)] px-1.5 py-0.5 rounded-full">
            <span className="w-1 h-1 rounded-full bg-[var(--amber)] pulse-dot"></span>LIVE
          </span>}
        </div>
        {showToggle && onTypeChange && (
          <div className="flex gap-0.5">
            {VIEWS.map(v => (
              <button key={v.id} onClick={() => onTypeChange(v.id)} title={v.label}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all duration-150
                  ${type===v.id ? 'bg-[var(--s4)] text-[var(--amber)] border border-[var(--adim2)]' : 'text-[var(--muted)] hover:text-[var(--text2)]'}`}>
                <i className={`bi ${v.icon}`}></i>
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="p-3 max-h-52 overflow-y-auto">{renderContent()}</div>
    </div>
  )
}
