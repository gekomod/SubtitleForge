'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface HistoryItem {
  filename: string
  originalFilename?: string
  engine: string; sourceLang: string; targetLang: string
  blocks: number; date: string; downloadUrl?: string
}

const ENGINE_META: Record<string,{color:string;icon:string}> = {
  libretranslate:{color:'#5b9dff',icon:'bi-globe'},   googlegtx:{color:'#5b9dff',icon:'bi-google'},
  ollama:{color:'#b57bff',icon:'bi-robot'},            deeplx:{color:'#f472b6',icon:'bi-translate'},
  deepseek:{color:'#22d3ee',icon:'bi-cpu'},            openai:{color:'#f0a500',icon:'bi-diagram-3'},
  anthropic:{color:'#fb923c',icon:'bi-stars'},         azure:{color:'#38bdf8',icon:'bi-cloud'},
  google:{color:'#4ade80',icon:'bi-google'},           deepl:{color:'#a78bfa',icon:'bi-translate'},
  custom:{color:'#94a3b8',icon:'bi-code-slash'},
}
const em = (k:string) => ENGINE_META[k] || {color:'#94a3b8',icon:'bi-cpu'}

const LANG: Record<string,string> = {
  pl:'PL',en:'EN',de:'DE',fr:'FR',es:'ES',it:'IT',ru:'RU',uk:'UK',
  cs:'CS',sk:'SK',zh:'ZH',ja:'JA',ko:'KO',ar:'AR',pt:'PT',nl:'NL',auto:'AUTO',
}

function getDisplayName(item: HistoryItem): string {
  if (item.originalFilename && item.originalFilename !== item.filename) return item.originalFilename
  if (item.filename) {
    const m = item.filename.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_(.+)$/i)
    if (m) return m[1]
    return item.filename
  }
  return 'Plik bez nazwy'
}

function getDownloadUrl(item: HistoryItem): string {
  if (item.downloadUrl) return item.downloadUrl
  if (item.filename) return `/download/${encodeURIComponent(item.filename)}`
  return ''
}

// ── Stats bar chart ─────────────────────────────────────────────────────
function MiniBar({label,value,max,color}:{label:string;value:number;max:number;color:string}) {
  const pct = max>0 ? Math.round(value/max*100) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[9px] text-[var(--muted)] w-20 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[var(--s4)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{width:`${pct}%`,background:color}}/>
      </div>
      <span className="font-mono text-[10px] text-[var(--text2)] w-4 text-right flex-shrink-0">{value}</span>
    </div>
  )
}

// ── Stats Panel ──────────────────────────────────────────────────────────
function StatsPanel({history}:{history:HistoryItem[]}) {
  const totalBlocks = history.reduce((s,h)=>s+(h.blocks||0),0)
  const byEngine: Record<string,number> = {}
  const byLang:   Record<string,number> = {}
  history.forEach(h=>{
    byEngine[h.engine]=(byEngine[h.engine]||0)+1
    byLang[h.targetLang]=(byLang[h.targetLang]||0)+1
  })
  const maxE = Math.max(...Object.values(byEngine),1)
  const maxL = Math.max(...Object.values(byLang),1)
  const ENGINE_COLORS: Record<string,string> = {libretranslate:'#5b9dff',googlegtx:'#5b9dff',ollama:'#b57bff',deeplx:'#f472b6',deepseek:'#22d3ee',openai:'#f0a500',anthropic:'#fb923c',azure:'#38bdf8',google:'#4ade80',deepl:'#a78bfa'}

  return (
    <div className="p-4 border-b border-[var(--border)] space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Summary cards */}
      <div className="bg-[var(--s3)] border border-[var(--border)] rounded-[var(--rl)] p-3 flex flex-col gap-0.5">
        <span className="font-mono text-[9px] text-[var(--muted)] uppercase tracking-wider">Tłumaczenia</span>
        <span className="font-display text-2xl text-[var(--amber)]">{history.length}</span>
        <span className="font-mono text-[10px] text-[var(--muted)]">{totalBlocks.toLocaleString()} bloków łącznie</span>
      </div>

      {/* By engine */}
      <div className="bg-[var(--s3)] border border-[var(--border)] rounded-[var(--rl)] p-3">
        <span className="font-mono text-[9px] text-[var(--muted)] uppercase tracking-wider block mb-2">Silniki</span>
        <div className="space-y-1.5">
          {Object.entries(byEngine).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([eng,count])=>(
            <MiniBar key={eng} label={eng} value={count} max={maxE} color={ENGINE_COLORS[eng]||'#94a3b8'}/>
          ))}
        </div>
      </div>

      {/* By lang */}
      <div className="bg-[var(--s3)] border border-[var(--border)] rounded-[var(--rl)] p-3">
        <span className="font-mono text-[9px] text-[var(--muted)] uppercase tracking-wider block mb-2">Języki docelowe</span>
        <div className="space-y-1.5">
          {Object.entries(byLang).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([lang,count])=>(
            <MiniBar key={lang} label={LANG[lang]||lang} value={count} max={maxL} color="var(--blue)"/>
          ))}
        </div>
      </div>
    </div>
      <ActivityHeatmap history={history}/>
      <EngineSpeedComparison history={history}/>
    </div>
  )
}

// ── Card view ────────────────────────────────────────────────────────────
function HistoryCard({item,index,onRemove,fmtDate}:{item:HistoryItem;index:number;onRemove:(i:number)=>void;fmtDate:(d:string)=>string}) {
  const {color,icon} = em(item.engine)
  const displayName  = getDisplayName(item)
  const downloadUrl  = getDownloadUrl(item)
  return (
    <div className="bg-[var(--s2)] border border-[var(--border)] rounded-[var(--rl)] p-4 hover:border-[var(--border2)] transition-all duration-200 group flex flex-col gap-3 slide-up">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-10 h-10 flex-shrink-0 rounded-[11px] flex items-center justify-center text-sm border"
          style={{background:`${color}12`,color,borderColor:`${color}30`}}>
          <i className="bi bi-file-earmark-text"></i>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-[var(--text)] truncate leading-tight" title={displayName}>{displayName}</div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full border flex items-center gap-1" style={{color,borderColor:`${color}40`,background:`${color}12`}}>
              <i className={`bi ${icon} text-[8px]`}></i>{item.engine}
            </span>
            <span className="font-mono text-[9px] bg-[var(--s3)] border border-[var(--border)] text-[var(--text2)] px-1.5 py-0.5 rounded-full">
              {LANG[item.sourceLang]||item.sourceLang} → {LANG[item.targetLang]||item.targetLang}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--muted)] border-t border-[var(--border)] pt-2.5">
        <span><i className="bi bi-collection text-[var(--amber)] mr-1 text-[9px]"></i>{(item.blocks||0).toLocaleString()} bl.</span>
        <span className="flex-1 text-right truncate">{fmtDate(item.date)}</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={()=>onRemove(index)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--red)] hover:bg-[var(--rdim)] border border-[var(--border)] transition-all text-xs opacity-0 group-hover:opacity-100 flex-shrink-0">
          <i className="bi bi-trash"></i>
        </button>
        {downloadUrl ? (
          <a href={downloadUrl} download className="flex-1 flex items-center justify-center gap-1.5 font-semibold text-xs px-3 py-2 rounded-lg transition-all no-underline hover:opacity-90 active:scale-95"
            style={{background:'var(--green)',color:'#071a11',boxShadow:'0 4px 12px -4px rgba(0,229,133,0.4)'}}>
            <i className="bi bi-download text-[10px]"></i>Pobierz
          </a>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-1.5 text-[var(--muted)] font-mono text-[10px] border border-[var(--border)] px-3 py-2 rounded-lg">
            <i className="bi bi-exclamation-circle text-[9px]"></i>Niedostępny
          </div>
        )}
      </div>
    </div>
  )
}

// ── List row ─────────────────────────────────────────────────────────────
function HistoryRow({item,index,onRemove,fmtDate}:{item:HistoryItem;index:number;onRemove:(i:number)=>void;fmtDate:(d:string)=>string}) {
  const {color,icon} = em(item.engine)
  const displayName  = getDisplayName(item)
  const downloadUrl  = getDownloadUrl(item)
  return (
    <div className="bg-[var(--s2)] border border-[var(--border)] rounded-[var(--rl)] px-4 py-3 hover:border-[var(--border2)] transition-all duration-150 group flex items-center gap-3">
      <div className="w-8 h-8 flex-shrink-0 rounded-[9px] flex items-center justify-center text-xs border" style={{background:`${color}12`,color,borderColor:`${color}30`}}>
        <i className={`bi ${icon}`}></i>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-[var(--text)] truncate" title={displayName}>{displayName}</div>
        <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-[var(--muted)] flex-wrap">
          <span style={{color}}>{item.engine}</span>
          <span>·</span><span>{LANG[item.sourceLang]||item.sourceLang}→{LANG[item.targetLang]||item.targetLang}</span>
          <span>·</span><span>{(item.blocks||0).toLocaleString()} bl.</span>
          <span>·</span><span>{fmtDate(item.date)}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button onClick={()=>onRemove(index)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--red)] hover:bg-[var(--rdim)] border border-[var(--border)] transition-all text-xs opacity-0 group-hover:opacity-100">
          <i className="bi bi-trash"></i>
        </button>
        {downloadUrl ? (
          <a href={downloadUrl} download className="flex items-center gap-1.5 font-semibold text-xs px-3 py-1.5 rounded-lg no-underline hover:opacity-90" style={{background:'var(--green)',color:'#071a11'}}>
            <i className="bi bi-download text-[10px]"></i>Pobierz
          </a>
        ) : (
          <span className="font-mono text-[10px] text-[var(--muted)] px-2">niedostępny</span>
        )}
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────

// ── Activity Heatmap ──────────────────────────────────────────────────────
function ActivityHeatmap({ history }: { history: HistoryItem[] }) {
  // Build last 12 weeks (84 days) activity map
  const days = 84
  const now = new Date(); now.setHours(0,0,0,0)
  const actMap: Record<string,number> = {}
  history.forEach(h => {
    const d = new Date(h.date); d.setHours(0,0,0,0)
    const key = d.toISOString().slice(0,10)
    actMap[key] = (actMap[key]||0) + 1
  })
  const cells = Array.from({length:days},(_,i) => {
    const d = new Date(now); d.setDate(d.getDate() - (days-1-i))
    const key = d.toISOString().slice(0,10)
    const count = actMap[key]||0
    const weekday = d.getDay()
    const label = d.toLocaleDateString('pl-PL',{day:'numeric',month:'short'})
    return { key, count, weekday, label, date: d }
  })
  const maxCount = Math.max(...cells.map(c=>c.count), 1)
  const total = cells.reduce((s,c)=>s+c.count, 0)
  const activeDays = cells.filter(c=>c.count>0).length

  return (
    <div className="bg-[var(--s3)] border border-[var(--border)] rounded-[var(--rl)] p-3">
      <div className="font-mono text-[9px] text-[var(--muted)] uppercase tracking-wider mb-2 flex items-center justify-between">
        <span><i className="bi bi-calendar3 mr-1 text-[var(--amber)]"></i>Aktywność (12 tygodni)</span>
        <span>{total} tłumaczeń · {activeDays} aktywnych dni</span>
      </div>
      <div className="flex gap-0.5 flex-wrap">
        {cells.map(cell => {
          const intensity = cell.count===0 ? 0 : Math.ceil(cell.count/maxCount*4)
          const colors = ['var(--s5)','rgba(240,165,0,.25)','rgba(240,165,0,.45)','rgba(240,165,0,.70)','var(--amber)']
          return (
            <div key={cell.key} title={`${cell.label}: ${cell.count} tłumaczeń`}
              className="w-3 h-3 rounded-sm cursor-default transition-all hover:scale-125 flex-shrink-0"
              style={{background:colors[intensity]}}/>
          )
        })}
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <span className="font-mono text-[9px] text-[var(--muted)]">Mniej</span>
        {['var(--s5)','rgba(240,165,0,.25)','rgba(240,165,0,.45)','rgba(240,165,0,.70)','var(--amber)'].map((c,i)=>(
          <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{background:c}}/>
        ))}
        <span className="font-mono text-[9px] text-[var(--muted)]">Więcej</span>
      </div>
    </div>
  )
}

// ── Engine Speed Comparison ───────────────────────────────────────────────
function EngineSpeedComparison({ history }: { history: HistoryItem[] }) {
  // Calculate avg blocks/min per engine from history (need elapsed — approximate from blocks count)
  // We don't store elapsed in history, so we compare by avg blocks per session instead
  const byEngine: Record<string,{total:number;sessions:number;avgBlocks:number}> = {}
  history.forEach(h => {
    if (!h.engine || !h.blocks) return
    if (!byEngine[h.engine]) byEngine[h.engine] = {total:0,sessions:0,avgBlocks:0}
    byEngine[h.engine].total += h.blocks
    byEngine[h.engine].sessions++
  })
  const engines = Object.entries(byEngine)
    .map(([eng,d]) => ({eng, avg: Math.round(d.total/d.sessions), sessions:d.sessions, total:d.total}))
    .sort((a,b)=>b.total-a.total)
  if (!engines.length) return null

  const maxAvg = Math.max(...engines.map(e=>e.avg), 1)
  const ENGINE_COLORS: Record<string,string> = {
    libretranslate:'#5b9dff',googlegtx:'#5b9dff',ollama:'#b57bff',deeplx:'#f472b6',
    deepseek:'#22d3ee',openai:'#f0a500',anthropic:'#fb923c',azure:'#38bdf8',google:'#4ade80',deepl:'#a78bfa'
  }

  return (
    <div className="bg-[var(--s3)] border border-[var(--border)] rounded-[var(--rl)] p-3">
      <div className="font-mono text-[9px] text-[var(--muted)] uppercase tracking-wider mb-3">
        <i className="bi bi-speedometer2 mr-1 text-[var(--blue)]"></i>Średnia liczba bloków / sesja
      </div>
      <div className="space-y-2">
        {engines.map(({eng,avg,sessions,total}) => {
          const c = ENGINE_COLORS[eng]||'#94a3b8'
          const pct = Math.round(avg/maxAvg*100)
          return (
            <div key={eng} className="flex items-center gap-2">
              <span className="font-mono text-[10px] w-24 truncate flex-shrink-0" style={{color:c}}>{eng}</span>
              <div className="flex-1 h-2 bg-[var(--s4)] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{width:`${pct}%`,background:c}}/>
              </div>
              <span className="font-mono text-[10px] text-[var(--muted)] flex-shrink-0 text-right w-20">
                {avg.toLocaleString()} bl · {sessions}×
              </span>
            </div>
          )
        })}
      </div>
      <p className="font-mono text-[9px] text-[var(--muted)] mt-2 pt-2 border-t border-[var(--border)]">
        Łącznie przetłumaczono {engines.reduce((s,e)=>s+e.total,0).toLocaleString()} bloków
      </p>
    </div>
  )
}

export default function HistoryTab() {
  const [history,    setHistory]    = useState<HistoryItem[]>([])
  const [filter,     setFilter]     = useState('')
  const [sortBy,     setSortBy]     = useState<'date'|'name'|'blocks'>('date')
  const [view,       setView]       = useState<'grid'|'list'>('grid')
  const [showStats,  setShowStats]  = useState(false)

  useEffect(()=>{ loadHistory() },[])

  const loadHistory = () => {
    try { const s=localStorage.getItem('translationHistory'); if(s)setHistory(JSON.parse(s)) } catch {}
  }

  const clearHistory = () => {
    if (!confirm('Wyczyścić całą historię?')) return
    localStorage.removeItem('translationHistory'); setHistory([]); toast.success('Historia wyczyszczona')
  }

  const removeItem = (i:number) => {
    const next = history.filter((_,j)=>j!==i)
    localStorage.setItem('translationHistory',JSON.stringify(next)); setHistory(next); toast.success('Usunięto')
  }

  const fmtDate = (d:string) => {
    const dt = new Date(d); const today = new Date()
    const isToday = dt.toDateString()===today.toDateString()
    const yDate = new Date(today); yDate.setDate(yDate.getDate()-1)
    const isYest = dt.toDateString()===yDate.toDateString()
    if (isToday) return `Dziś, ${dt.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})}`
    if (isYest)  return `Wczoraj, ${dt.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})}`
    return dt.toLocaleString('pl-PL',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})
  }

  // Export
  const exportCSV = () => {
    const header = 'Plik,Silnik,Źródło,Cel,Bloki,Data\n'
    const rows = history.map(h=>[
      `"${getDisplayName(h).replace(/"/g,'""')}"`,
      h.engine, h.sourceLang, h.targetLang, h.blocks||0,
      new Date(h.date).toLocaleString('pl-PL')
    ].join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+header+rows],{type:'text/csv;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='subtitleforge-historia.csv'; a.click()
    URL.revokeObjectURL(url); toast.success('Eksport CSV gotowy')
  }

  const exportJSON = () => {
    const data = history.map(h=>({...h, displayName:getDisplayName(h)}))
    const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='subtitleforge-historia.json'; a.click()
    URL.revokeObjectURL(url); toast.success('Eksport JSON gotowy')
  }

  const filtered = history
    .filter(h=>!filter||getDisplayName(h).toLowerCase().includes(filter.toLowerCase())||h.engine.includes(filter.toLowerCase()))
    .sort((a,b)=>{
      if (sortBy==='name')   return getDisplayName(a).localeCompare(getDisplayName(b))
      if (sortBy==='blocks') return (b.blocks||0)-(a.blocks||0)
      return new Date(b.date).getTime()-new Date(a.date).getTime()
    })

  const totalBlocks = history.reduce((s,h)=>s+(h.blocks||0),0)
  const engines = Array.from(new Set(history.map(h=>h.engine)))

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
            <span className="font-mono text-xs bg-[var(--s3)] border border-[var(--border2)] px-2 py-0.5 rounded-full text-[var(--muted)]">{history.length}</span>
            <button onClick={()=>setShowStats(!showStats)}
              className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-colors ${showStats?'text-[var(--amber)] border-[var(--adim2)] bg-[var(--adim)]':'text-[var(--muted)] border-[var(--border)] hover:border-[var(--border2)]'}`}>
              <i className="bi bi-bar-chart-fill mr-1 text-[9px]"></i>Statystyki
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] text-xs pointer-events-none"></i>
              <input type="text" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Szukaj…"
                className="text-xs py-1.5 pl-7 pr-3 w-36 sm:w-44 rounded-lg border border-[var(--border)] bg-[var(--s2)]"/>
            </div>

            <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)}
              className="text-xs py-1.5 px-2 rounded-lg border border-[var(--border)] bg-[var(--s2)] text-[var(--text2)]">
              <option value="date">Najnowsze</option>
              <option value="name">Nazwa</option>
              <option value="blocks">Bloki</option>
            </select>

            <div className="flex border border-[var(--border)] rounded-lg overflow-hidden">
              {(['grid','list'] as const).map(v=>(
                <button key={v} onClick={()=>setView(v)}
                  className={`px-2.5 py-1.5 text-xs transition-colors ${view===v?'bg-[var(--s3)] text-[var(--amber)]':'text-[var(--muted)] hover:text-[var(--text2)]'}`}>
                  <i className={`bi ${v==='grid'?'bi-grid-3x3-gap':'bi-list-ul'}`}></i>
                </button>
              ))}
            </div>

            {/* Export dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 border border-[var(--border)] text-[var(--text2)] bg-[var(--s2)] hover:bg-[var(--s3)] py-1.5 px-3 rounded-xl text-xs font-medium transition-all">
                <i className="bi bi-box-arrow-up text-[10px]"></i>
                <span className="hidden sm:inline">Eksport</span>
                <i className="bi bi-chevron-down text-[9px]"></i>
              </button>
              <div className="absolute right-0 top-full mt-1 bg-[var(--s2)] border border-[var(--border2)] rounded-xl shadow-xl z-20 min-w-[130px] overflow-hidden opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-150">
                <button onClick={exportCSV} className="w-full text-left px-3 py-2.5 text-xs hover:bg-[var(--s3)] flex items-center gap-2 text-[var(--text2)]">
                  <i className="bi bi-filetype-csv text-[var(--green)]"></i>Eksportuj CSV
                </button>
                <button onClick={exportJSON} className="w-full text-left px-3 py-2.5 text-xs hover:bg-[var(--s3)] flex items-center gap-2 text-[var(--text2)]">
                  <i className="bi bi-filetype-json text-[var(--blue)]"></i>Eksportuj JSON
                </button>
              </div>
            </div>

            <button onClick={clearHistory}
              className="flex items-center gap-1.5 border border-[rgba(255,77,94,.3)] text-[var(--red)] bg-[var(--rdim)] hover:bg-[var(--rdim2)] py-1.5 px-3 rounded-xl text-xs font-semibold transition-all">
              <i className="bi bi-trash"></i>
              <span className="hidden sm:inline">Wyczyść</span>
            </button>
          </div>
        </div>

        {/* Summary row */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border)] flex-wrap">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--muted)]">
            <i className="bi bi-collection text-[var(--amber)] text-xs"></i>
            <span><span className="text-[var(--text2)] font-medium">{totalBlocks.toLocaleString()}</span> bloków łącznie</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--muted)] flex-wrap">
            <i className="bi bi-cpu text-[var(--blue)] text-xs"></i>
            {engines.map(e=>(
              <span key={e} className="inline-block ml-1 px-1.5 rounded text-[9px] border"
                style={{color:em(e).color,borderColor:`${em(e).color}35`,background:`${em(e).color}10`}}>{e}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats panel */}
      {showStats && <StatsPanel history={history}/>}

      {/* Content */}
      <div className="p-4">
        {filtered.length===0 && filter ? (
          <div className="text-center py-10 text-[var(--muted)] text-sm font-mono">Brak wyników dla „{filter}"</div>
        ) : view==='grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((item,i)=><HistoryCard key={i} item={item} index={i} onRemove={removeItem} fmtDate={fmtDate}/>)}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((item,i)=><HistoryRow key={i} item={item} index={i} onRemove={removeItem} fmtDate={fmtDate}/>)}
          </div>
        )}
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent"></div>
    </div>
  )
}
