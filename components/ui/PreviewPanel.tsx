'use client'
import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'

const esc = (s:string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
const clip = (s:string, n=120) => s.length > n ? esc(s.slice(0,n))+'…' : esc(s)

const VIEWS = [
  { id:'original'   as const, icon:'bi-file-text',         label:'Oryginał' },
  { id:'translated' as const, icon:'bi-file-earmark-check',label:'Tłumaczenie' },
  { id:'sidebyside' as const, icon:'bi-layout-split',      label:'Obok siebie' },
  { id:'edit'       as const, icon:'bi-pencil-square',     label:'Edytor' },
]

interface Props {
  previewData: string[]
  type: 'original'|'translated'|'sidebyside'|'edit'
  originalData?: string[]
  translatedData?: string[]
  onTypeChange?: (t:'original'|'translated'|'sidebyside'|'edit') => void
  showToggle?: boolean
  isLive?: boolean
  outputFilename?: string   // needed for save
}

export default function PreviewPanel({
  previewData=[], type, originalData=[], translatedData=[], onTypeChange,
  showToggle=false, isLive=false, outputFilename
}: Props) {

  // Editor state
  const [edits, setEdits]       = useState<Map<number,string>>(new Map())
  const [editing, setEditing]   = useState<number|null>(null)
  const [editVal, setEditVal]   = useState('')
  const [saving,  setSaving]    = useState(false)

  const startEdit = (idx:number, current:string) => {
    setEditing(idx); setEditVal(current)
  }

  const commitEdit = (idx:number) => {
    if (editVal.trim() !== (translatedData[idx] || '')) {
      setEdits(prev => { const m=new Map(prev); m.set(idx, editVal); return m })
    }
    setEditing(null)
  }

  const revertEdit = (idx:number) => {
    setEdits(prev => { const m=new Map(prev); m.delete(idx); return m })
  }

  const saveEdits = useCallback(async () => {
    if (!outputFilename || edits.size === 0) return
    setSaving(true)
    try {
      const entries = Array.from(edits.entries()).map(([blockIndex, text]) => ({ blockIndex, text }))
      const r = await fetch('/api/edit-save', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ filename: outputFilename, edits: entries })
      }).then(r=>r.json())
      if (r.success) {
        toast.success(`Zapisano ${r.saved} zmian w pliku`)
        setEdits(new Map())
      } else {
        toast.error(r.error || 'Błąd zapisu')
      }
    } catch { toast.error('Błąd połączenia') }
    setSaving(false)
  }, [outputFilename, edits])

  // ── Render helpers ────────────────────────────────────────────────────
  const Line = ({ text, idx, dim=false }:{ text:string; idx:number; dim?:boolean }) => (
    <div className="flex gap-2 py-1.5 border-b border-[var(--border)] last:border-0">
      <span className="font-mono text-[10px] w-5 text-right flex-shrink-0 text-[var(--muted)] mt-0.5 select-none">{idx+1}</span>
      <span className={`font-mono text-[11px] leading-relaxed flex-1 min-w-0 break-words whitespace-pre-wrap ${dim ? 'text-[var(--text2)]' : 'text-[var(--text)]'}`}
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

  const EditLine = ({ idx }:{ idx:number }) => {
    const hasEdit = edits.has(idx)
    const current = edits.get(idx) ?? translatedData[idx] ?? ''
    const isEditingThis = editing === idx

    return (
      <div className={`flex gap-2 py-1.5 border-b border-[var(--border)] last:border-0 group ${hasEdit?'bg-[rgba(240,165,0,0.04)]':''}`}>
        <span className="font-mono text-[10px] w-5 text-right flex-shrink-0 text-[var(--muted)] mt-1 select-none">{idx+1}</span>
        <div className="flex-1 min-w-0">
          {isEditingThis ? (
            <div className="flex flex-col gap-1">
              <textarea
                autoFocus
                value={editVal}
                onChange={e=>setEditVal(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'&&e.ctrlKey){e.preventDefault();commitEdit(idx)} if(e.key==='Escape'){setEditing(null)} }}
                className="w-full font-mono text-[11px] text-[var(--text)] bg-[var(--s3)] border border-[var(--amber)] rounded-lg p-2 resize-none min-h-[60px] focus:outline-none focus:ring-2 focus:ring-[rgba(240,165,0,0.3)]"
                rows={2}
              />
              <div className="flex items-center gap-2">
                <button onClick={()=>commitEdit(idx)}
                  className="font-mono text-[9px] bg-[var(--amber)] text-[#1a0e00] px-2 py-0.5 rounded font-semibold hover:opacity-90">
                  Ctrl+Enter ✓
                </button>
                <button onClick={()=>setEditing(null)}
                  className="font-mono text-[9px] text-[var(--muted)] border border-[var(--border)] px-2 py-0.5 rounded hover:text-[var(--red)]">
                  Esc ✗
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-1.5 cursor-text" onClick={()=>startEdit(idx, current)}>
              <span className={`font-mono text-[11px] leading-relaxed flex-1 break-words whitespace-pre-wrap ${hasEdit?'text-[var(--amber)]':'text-[var(--text)]'}`}>
                {current || <span className="text-[var(--muted)] italic">— brak tłumaczenia —</span>}
              </span>
              <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={e=>{e.stopPropagation();startEdit(idx,current)}}
                  className="w-5 h-5 rounded flex items-center justify-center text-[var(--muted)] hover:text-[var(--amber)] hover:bg-[var(--adim)] text-[10px]">
                  <i className="bi bi-pencil"></i>
                </button>
                {hasEdit && (
                  <button onClick={e=>{e.stopPropagation();revertEdit(idx)}}
                    className="w-5 h-5 rounded flex items-center justify-center text-[var(--muted)] hover:text-[var(--red)] hover:bg-[var(--rdim)] text-[10px]">
                    <i className="bi bi-arrow-counterclockwise"></i>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────
  const renderContent = () => {
    if (type === 'edit') {
      const data = translatedData.length ? translatedData : []
      if (!data.length) return (
        <div className="py-8 text-center font-mono text-xs text-[var(--muted)]">
          <i className="bi bi-pencil-square block text-2xl mb-2 opacity-30"></i>
          Edytor dostępny po zakończeniu tłumaczenia
        </div>
      )
      return (
        <>
          {data.map((_,i) => <EditLine key={i} idx={i}/>)}
        </>
      )
    }

    if (type === 'sidebyside') {
      const len = Math.max(originalData.length, translatedData.length, 1)
      return (
        <div className="grid grid-cols-2 divide-x divide-[var(--border)]">
          <div className="pr-2">
            <div className="text-[9px] font-mono uppercase tracking-widest text-[var(--muted)] mb-2 flex items-center gap-1">
              <i className="bi bi-file-text"></i>Oryginał
            </div>
            {originalData.map((t,i) => <Line key={i} text={t} idx={i} dim/>)}
          </div>
          <div className="pl-2">
            <div className="text-[9px] font-mono uppercase tracking-widest text-[var(--muted)] mb-2 flex items-center gap-1">
              {isLive && <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] pulse-dot"></span>}
              <i className="bi bi-file-earmark-check"></i>{isLive?'Live':'Tłumaczenie'}
            </div>
            {Array.from({length:len}).map((_,i) => {
              const t = translatedData[i]
              if (!t && isLive) return <Pending key={i} idx={i}/>
              return t ? <Line key={i} text={t} idx={i}/> : null
            })}
          </div>
        </div>
      )
    }

    const data = type==='original' ? (previewData.length ? previewData : originalData) : translatedData
    if (!data.length) return (
      <div className="py-6 text-center font-mono text-xs text-[var(--muted)]">
        <i className="bi bi-eye-slash block text-2xl mb-2 opacity-30"></i>Brak podglądu
      </div>
    )
    return data.slice(0,15).map((t,i) => <Line key={i} text={t} idx={i} dim={type==='original'}/>)
  }

  const views = showToggle ? VIEWS : VIEWS.filter(v=>v.id!=='edit'&&v.id!=='translated'&&v.id!=='sidebyside')
  const showEditBar = type==='edit' && edits.size>0

  return (
    <div className="bg-[var(--s2)] border border-[var(--border)] rounded-[var(--rl)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--s3)]">
        <div className="flex items-center gap-2">
          <i className="bi bi-eye text-[var(--amber)] text-xs"></i>
          <span className="text-[11px] font-semibold text-[var(--text2)]">Podgląd</span>
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--amber)] bg-[var(--adim)] px-1.5 py-0.5 rounded-full">
              <span className="w-1 h-1 rounded-full bg-[var(--amber)] pulse-dot"></span>LIVE
            </span>
          )}
          {type==='edit' && edits.size>0 && (
            <span className="font-mono text-[10px] text-[var(--amber)] bg-[var(--adim)] px-1.5 py-0.5 rounded-full">
              {edits.size} zmian
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Save button for editor mode */}
          {showEditBar && outputFilename && (
            <button onClick={saveEdits} disabled={saving}
              className="flex items-center gap-1 font-mono text-[10px] bg-[var(--green)] text-[#071a11] px-2.5 py-1 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
              {saving ? <span className="w-3 h-3 border border-t-transparent border-[#071a11] rounded-full animate-spin"></span> : <i className="bi bi-floppy text-[9px]"></i>}
              Zapisz plik
            </button>
          )}

          {showToggle && onTypeChange && (
            <div className="flex gap-0.5">
              {VIEWS.map(v => (
                <button key={v.id} onClick={()=>onTypeChange(v.id)} title={v.label}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all duration-150
                    ${type===v.id ? 'bg-[var(--s4)] text-[var(--amber)] border border-[var(--adim2)]' : 'text-[var(--muted)] hover:text-[var(--text2)]'}`}>
                  <i className={`bi ${v.icon}`}></i>
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 max-h-72 overflow-y-auto">{renderContent()}</div>

      {type==='edit' && translatedData.length>0 && (
        <div className="px-3 py-2 border-t border-[var(--border)] bg-[var(--s3)]">
          <p className="font-mono text-[9px] text-[var(--muted)] flex items-center gap-1.5">
            <i className="bi bi-info-circle text-[var(--blue)] text-xs"></i>
            Kliknij blok aby edytować · Ctrl+Enter = zatwierdź · Esc = anuluj · "Zapisz plik" nadpisuje plik na dysku
          </p>
        </div>
      )}
    </div>
  )
}
