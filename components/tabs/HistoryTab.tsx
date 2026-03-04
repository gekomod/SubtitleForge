'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface HistoryItem {
  filename: string          // full output filename (UUID_name.lang.ext)
  originalFilename?: string // human-readable original name
  engine: string
  sourceLang: string
  targetLang: string
  blocks: number
  date: string
  downloadUrl?: string
}

const ENGINE_META: Record<string,{color:string;icon:string}> = {
  libretranslate: { color:'#5b9dff', icon:'bi-globe' },
  googlegtx:      { color:'#5b9dff', icon:'bi-google' },
  ollama:         { color:'#b57bff', icon:'bi-robot' },
  deeplx:         { color:'#f472b6', icon:'bi-translate' },
  deepseek:       { color:'#22d3ee', icon:'bi-cpu' },
  openai:         { color:'#f0a500', icon:'bi-diagram-3' },
  anthropic:      { color:'#fb923c', icon:'bi-stars' },
  azure:          { color:'#38bdf8', icon:'bi-cloud' },
  google:         { color:'#4ade80', icon:'bi-google' },
  deepl:          { color:'#a78bfa', icon:'bi-translate' },
  custom:         { color:'#94a3b8', icon:'bi-code-slash' },
}
const em = (k:string) => ENGINE_META[k] || { color:'#94a3b8', icon:'bi-cpu' }

const LANG_NAMES: Record<string,string> = {
  pl:'PL',en:'EN',de:'DE',fr:'FR',es:'ES',it:'IT',ru:'RU',uk:'UK',
  cs:'CS',sk:'SK',zh:'ZH',ja:'JA',ko:'KO',ar:'AR',pt:'PT',nl:'NL',auto:'AUTO',
}

// Extract human-readable display name from history item
function getDisplayName(item: HistoryItem): string {
  // Prefer explicitly saved originalFilename
  if (item.originalFilename && item.originalFilename !== item.filename) {
    return item.originalFilename
  }
  // Try to extract from output filename: UUID_OriginalName.lang.ext → OriginalName.lang.ext
  if (item.filename) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_(.+)$/i
    const match = item.filename.match(uuidPattern)
    if (match) return match[1]
    return item.filename
  }
  return 'Plik bez nazwy'
}

// Build correct download URL
function getDownloadUrl(item: HistoryItem): string {
  if (item.downloadUrl) return item.downloadUrl
  if (item.filename) return `/download/${encodeURIComponent(item.filename)}`
  return ''
}

export default function HistoryTab() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [filter, setFilter]   = useState('')
  const [sortBy, setSortBy]   = useState<'date'|'name'|'blocks'>('date')
  const [view, setView]       = useState<'grid'|'list'>('grid')

  useEffect(() => { loadHistory() }, [])

  const loadHistory = () => {
    try {
      const s = localStorage.getItem('translationHistory')
      if (s) setHistory(JSON.parse(s))
    } catch {}
  }

  const clearHistory = () => {
    if (!confirm('Wyczyścić całą historię?')) return
    localStorage.removeItem('translationHistory'); setHistory([]); toast.success('Historia wyczyszczona')
  }

  const removeItem = (i: number) => {
    const next = history.filter((_,j) => j !== i)
    localStorage.setItem('translationHistory', JSON.stringify(next))
    setHistory(next); toast.success('Usunięto')
  }

  const fmtDate = (d: string) => {
    const dt = new Date(d)
    const today = new Date()
    const isToday = dt.toDateString() === today.toDateString()
    const isYesterday = new Date(today.setDate(today.getDate()-1)).toDateString() === dt.toDateString()
    if (isToday)     return `Dziś, ${dt.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})}`
    if (isYesterday) return `Wczoraj, ${dt.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})}`
    return dt.toLocaleString('pl-PL',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})
  }

  const filtered = history
    .filter(h => !filter || getDisplayName(h).toLowerCase().includes(filter.toLowerCase()) || h.engine.toLowerCase().includes(filter.toLowerCase()))
    .sort((a,b) => {
      if (sortBy === 'name')   return getDisplayName(a).localeCompare(getDisplayName(b))
      if (sortBy === 'blocks') return (b.blocks||0) - (a.blocks||0)
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

  // Stats
  const totalBlocks = history.reduce((s,h) => s+(h.blocks||0), 0)
  const engines = [...new Set(history.map(h=>h.engine))]

  if (!history.length) return (
    <div className="bg-[var(--s1)] border border-[var(--border)] rounded-[var(--rxl)] p-8 fade-in">
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-[var(--s3)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
          <i className="bi bi-clock-history text-3xl text-[var(--dim)]"></i>
        </div>
        <p className="font-semibold text-[var(--text2)] mb-1">Brak historii</p>
        <p className="font-mono text-xs text-[var(--muted)]">Przetłumacz plik żeby zobaczyć go tutaj</p>
      </div>
    </div>
  )

  return (
    <div className="bg-[var(--s1)] border border-[var(--border)] rounded-[var(--rxl)] overflow-hidden fade-in">
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--amber)] to-transparent opacity-20"></div>

      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <i className="bi bi-clock-history text-[var(--amber)]"></i>
            <span className="font-semibold text-[var(--text)]">Historia</span>
            <span className="font-mono text-xs bg-[var(--s3)] border border-[var(--border2)] px-2 py-0.5 rounded-full text-[var(--muted)]">
              {history.length}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] text-xs pointer-events-none"></i>
              <input type="text" value={filter} onChange={e=>setFilter(e.target.value)}
                placeholder="Szukaj pliku…"
                className="text-xs py-1.5 pl-7 pr-3 w-36 sm:w-48 rounded-lg border border-[var(--border)] bg-[var(--s2)]" />
            </div>

            {/* Sort */}
            <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)}
              className="text-xs py-1.5 px-2 w-auto rounded-lg border border-[var(--border)] bg-[var(--s2)] text-[var(--text2)]">
              <option value="date">Najnowsze</option>
              <option value="name">Nazwa</option>
              <option value="blocks">Bloki</option>
            </select>

            {/* View toggle */}
            <div className="flex border border-[var(--border)] rounded-lg overflow-hidden">
              {(['grid','list'] as const).map(v => (
                <button key={v} onClick={()=>setView(v)}
                  className={`px-2.5 py-1.5 text-xs transition-colors ${view===v ? 'bg-[var(--s3)] text-[var(--amber)]' : 'text-[var(--muted)] hover:text-[var(--text2)]'}`}>
                  <i className={`bi ${v==='grid' ? 'bi-grid-3x3-gap' : 'bi-list-ul'}`}></i>
                </button>
              ))}
            </div>

            {/* Clear */}
            <button onClick={clearHistory}
              className="flex items-center gap-1.5 border border-[rgba(255,77,94,.3)] text-[var(--red)] bg-[var(--rdim)] hover:bg-[var(--rdim2)] py-1.5 px-3 rounded-xl text-xs font-semibold transition-all">
              <i className="bi bi-trash"></i>
              <span className="hidden sm:inline">Wyczyść</span>
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border)] flex-wrap">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--muted)]">
            <i className="bi bi-collection text-[var(--amber)] text-xs"></i>
            <span><span className="text-[var(--text2)] font-medium">{totalBlocks.toLocaleString()}</span> bloków łącznie</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--muted)]">
            <i className="bi bi-cpu text-[var(--blue)] text-xs"></i>
            <span>Silniki: {engines.map(e => (
              <span key={e} className="inline-block ml-1 px-1.5 py-0 rounded text-[9px] border"
                style={{color:em(e).color, borderColor:`${em(e).color}35`, background:`${em(e).color}10`}}>
                {e}
              </span>
            ))}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {filtered.length === 0 && filter ? (
          <div className="text-center py-10 text-[var(--muted)] text-sm font-mono">
            Brak wyników dla „{filter}"
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((item, i) => <HistoryCard key={i} item={item} index={i} onRemove={removeItem} fmtDate={fmtDate} />)}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((item, i) => <HistoryRow key={i} item={item} index={i} onRemove={removeItem} fmtDate={fmtDate} />)}
          </div>
        )}
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent"></div>
    </div>
  )
}

// ── Card view ────────────────────────────────────────────────────────────
function HistoryCard({ item, index, onRemove, fmtDate }: {
  item: HistoryItem; index: number; onRemove:(i:number)=>void; fmtDate:(d:string)=>string
}) {
  const { color, icon } = em(item.engine)
  const displayName = getDisplayName(item)
  const downloadUrl = getDownloadUrl(item)

  return (
    <div className="bg-[var(--s2)] border border-[var(--border)] rounded-[var(--rl)] p-4 hover:border-[var(--border2)] transition-all duration-200 group flex flex-col gap-3 slide-up">
      {/* File info */}
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-10 h-10 flex-shrink-0 rounded-[11px] flex items-center justify-center text-sm border"
          style={{ background:`${color}12`, color, borderColor:`${color}30` }}>
          <i className="bi bi-file-earmark-text"></i>
        </div>
        <div className="min-w-0 flex-1">
          {/* Primary: original file name */}
          <div className="text-[13px] font-semibold text-[var(--text)] truncate leading-tight" title={displayName}>
            {displayName}
          </div>
          {/* Secondary: engine + langs */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full border flex items-center gap-1"
              style={{ color, borderColor:`${color}40`, background:`${color}12` }}>
              <i className={`bi ${icon} text-[8px]`}></i>
              {item.engine}
            </span>
            <span className="font-mono text-[9px] bg-[var(--s3)] border border-[var(--border)] text-[var(--text2)] px-1.5 py-0.5 rounded-full">
              {LANG_NAMES[item.sourceLang]||item.sourceLang} → {LANG_NAMES[item.targetLang]||item.targetLang}
            </span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--muted)] border-t border-[var(--border)] pt-2.5">
        <span><i className="bi bi-collection text-[var(--amber)] mr-1 text-[9px]"></i>{(item.blocks||0).toLocaleString()} bl.</span>
        <span className="flex-1 text-right truncate">{fmtDate(item.date)}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button onClick={() => onRemove(index)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--red)] hover:bg-[var(--rdim)] border border-[var(--border)] transition-all text-xs opacity-0 group-hover:opacity-100 flex-shrink-0">
          <i className="bi bi-trash"></i>
        </button>
        {downloadUrl ? (
          <a href={downloadUrl} download
            className="flex-1 flex items-center justify-center gap-1.5 text-[#071a11] font-semibold text-xs px-3 py-2 rounded-lg transition-all no-underline hover:opacity-90 active:scale-95"
            style={{background:'var(--green)', boxShadow:'0 4px 12px -4px rgba(0,229,133,0.4)'}}>
            <i className="bi bi-download text-[10px]"></i>
            Pobierz
          </a>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-1.5 text-[var(--muted)] font-mono text-[10px] border border-[var(--border)] px-3 py-2 rounded-lg">
            <i className="bi bi-exclamation-circle text-[9px]"></i>
            Plik niedostępny
          </div>
        )}
      </div>
    </div>
  )
}

// ── List row view ─────────────────────────────────────────────────────────
function HistoryRow({ item, index, onRemove, fmtDate }: {
  item: HistoryItem; index: number; onRemove:(i:number)=>void; fmtDate:(d:string)=>string
}) {
  const { color, icon } = em(item.engine)
  const displayName = getDisplayName(item)
  const downloadUrl = getDownloadUrl(item)

  return (
    <div className="bg-[var(--s2)] border border-[var(--border)] rounded-[var(--rl)] px-4 py-3 hover:border-[var(--border2)] transition-all duration-150 group flex items-center gap-3">
      {/* Engine icon */}
      <div className="w-8 h-8 flex-shrink-0 rounded-[9px] flex items-center justify-center text-xs border"
        style={{ background:`${color}12`, color, borderColor:`${color}30` }}>
        <i className={`bi ${icon}`}></i>
      </div>

      {/* Name — takes all available space */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-[var(--text)] truncate" title={displayName}>
          {displayName}
        </div>
        <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-[var(--muted)] flex-wrap">
          <span style={{color}}>{item.engine}</span>
          <span>·</span>
          <span>{LANG_NAMES[item.sourceLang]||item.sourceLang}→{LANG_NAMES[item.targetLang]||item.targetLang}</span>
          <span>·</span>
          <span>{(item.blocks||0).toLocaleString()} bloków</span>
          <span>·</span>
          <span>{fmtDate(item.date)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button onClick={() => onRemove(index)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--red)] hover:bg-[var(--rdim)] border border-[var(--border)] transition-all text-xs opacity-0 group-hover:opacity-100">
          <i className="bi bi-trash"></i>
        </button>
        {downloadUrl ? (
          <a href={downloadUrl} download
            className="flex items-center gap-1.5 text-[#071a11] font-semibold text-xs px-3 py-1.5 rounded-lg transition-all no-underline hover:opacity-90"
            style={{background:'var(--green)'}}>
            <i className="bi bi-download text-[10px]"></i>
            Pobierz
          </a>
        ) : (
          <span className="font-mono text-[10px] text-[var(--muted)] px-2">niedostępny</span>
        )}
      </div>
    </div>
  )
}
