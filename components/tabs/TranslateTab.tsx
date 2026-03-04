'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslationStore } from '@/lib/store/translationStore'
import { LANGUAGE_NAMES } from '@/lib/config/constants'
import FileUpload from '@/components/ui/FileUpload'
import EngineSelector from '@/components/ui/EngineSelector'
import LanguageSelector from '@/components/ui/LanguageSelector'
import PreviewPanel from '@/components/ui/PreviewPanel'
import ProgressBar from '@/components/ui/ProgressBar'
import SuccessCard from '@/components/ui/SuccessCard'
import ConfigModal from '@/components/modals/ConfigModal'
import TestModal from '@/components/modals/TestModal'
import StatsCards from '@/components/ui/StatsCards'
import toast from 'react-hot-toast'

const DEFAULT_ENGINES: Record<string,any> = {
  libretranslate:{ name:'LibreTranslate', icon:'bi-globe',     description:'Open source, lokalny serwer', server:'http://localhost:5010', api_key:'', enabled:true, popular:true },
  googlegtx:     { name:'Google GTX',     icon:'bi-google',    description:'Darmowe API Google Translate',                                enabled:true, popular:true },
  ollama:        { name:'Ollama',         icon:'bi-robot',     description:'Lokalne modele AI',           server:'http://localhost:11434', model:'llama3.2:latest', api_key:'', enabled:true, popular:true },
  deeplx:        { name:'DeepLX',         icon:'bi-translate', description:'Darmowy proxy DeepL',         server:'http://localhost:1188',  token:'', api_key:'', enabled:true, popular:true },
  deepseek:      { name:'DeepSeek',       icon:'bi-cpu',       description:'Zaawansowane modele AI',      api_key:'', model:'deepseek-chat', enabled:false },
  openai:        { name:'OpenRouter',     icon:'bi-diagram-3', description:'OpenRouter — Llama, GPT…',   api_key:'', model:'meta-llama/llama-3.2-3b-instruct:free', enabled:false, popular:true },
}

type EK = keyof typeof DEFAULT_ENGINES

const fmt = (s:number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

// ── Custom hooks ──────────────────────────────────────────────────────────

function useTimer() {
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<NodeJS.Timeout|null>(null)
  const t0Ref    = useRef<number|null>(null)

  const start = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    t0Ref.current = Date.now(); setElapsed(0)
    timerRef.current = setInterval(() => {
      if (t0Ref.current) setElapsed(Math.floor((Date.now()-t0Ref.current)/1000))
    }, 1000)
  },[])

  const stop = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  },[])

  const reset = useCallback(() => { stop(); setElapsed(0) },[stop])

  return { elapsed, start, stop, reset }
}

function useEngines() {
  const [engines, setEngines] = useState<Record<string,any>>(DEFAULT_ENGINES)
  const [loaded, setLoaded]   = useState(false)

  const reload = useCallback(async () => {
    try {
      const data = await fetch('/api/configs').then(r=>r.json())
      const fixed = {...data}
      Object.keys(fixed).forEach(k => { if(k in DEFAULT_ENGINES) fixed[k].icon = DEFAULT_ENGINES[k].icon })
      setEngines(fixed); setLoaded(true)
      return Object.keys(fixed)[0] as EK
    } catch {
      setLoaded(true)
      return 'libretranslate' as EK
    }
  },[])

  const saveConfig = useCallback(async (eng:string, cfg:any) => {
    const data = await fetch(`/api/config/${eng}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(cfg)}).then(r=>r.json())
    if (data.success) {
      setEngines(prev => ({...prev, [eng]: {...prev[eng], ...cfg}}))
      return true
    }
    return false
  },[])

  return { engines, loaded, reload, saveConfig }
}

// ── ShortcutsOverlay ──────────────────────────────────────────────────────
function ShortcutsOverlay({ onClose }: { onClose:()=>void }) {
  const shortcuts = [
    ['Spacja', 'Rozpocznij tłumaczenie'],
    ['1 / 2 / 3', 'Przełącz zakładki'],
    ['Esc', 'Zamknij okna'],
    ['Ctrl+R', 'Reset / nowy plik'],
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm fade-in"
      onClick={onClose}>
      <div className="bg-[var(--s2)] border border-[var(--border2)] rounded-[var(--rxl)] p-6 w-80 shadow-2xl pop-in"
        onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-[var(--text)] tracking-wide">SKRÓTY</h3>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--red)] transition-colors"><i className="bi bi-x text-xl"></i></button>
        </div>
        <div className="space-y-2">
          {shortcuts.map(([key,desc]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <kbd className="font-mono text-[11px] bg-[var(--s4)] border border-[var(--border2)] text-[var(--amber)] px-2.5 py-1 rounded-lg tracking-wide flex-shrink-0">
                {key}
              </kbd>
              <span className="text-xs text-[var(--text2)] text-right">{desc}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="font-mono text-[10px] text-[var(--muted)] text-center">Naciśnij ? lub Esc aby zamknąć</p>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────
export default function TranslateTab() {
  const {
    currentFileId, currentTaskId, currentFileBlocks, currentOutputFilename,
    sourceLang, targetLang,
    setCurrentFileId, setCurrentTaskId, setCurrentFileBlocks, setCurrentOutputFilename,
    setSourceLang, setTargetLang, incrementTotalTranslations, reset: resetState
  } = useTranslationStore()

  const { engines, reload: reloadEngines, saveConfig } = useEngines()
  const { elapsed, start: startTimer, stop: stopTimer, reset: resetTimer } = useTimer()

  const [engine, setEngine]         = useState<EK|null>(null)
  const [uploading, setUploading]   = useState(false)
  const [fileInfo, setFileInfo]     = useState<{filename:string;saved_filename:string;size:number;type:string;detectedLang?:string}|null>(null)
  const [translating, setTranslating] = useState(false)
  const [progress, setProgress]     = useState(0)
  const [curBlock, setCurBlock]     = useState(0)
  const [success, setSuccess]       = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [pvType, setPvType]         = useState<'original'|'translated'|'sidebyside'>('original')
  const [origPv, setOrigPv]         = useState<string[]>([])
  const [transPv, setTransPv]       = useState<string[]>([])
  const [livePv, setLivePv]         = useState<Map<number,string>>(new Map())
  const [errMsg, setErrMsg]         = useState<string|null>(null)
  const [batchSize, setBatchSize]   = useState(1)
  const [showAdv, setShowAdv]       = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [cfgModal, setCfgModal]     = useState<{open:boolean;engine:string;config:any}>({open:false,engine:'',config:null})
  const [testModal, setTestModal]   = useState<{open:boolean;loading:boolean;result:any}>({open:false,loading:false,result:null})
  const [recentEngines, setRecentEngines] = useState<string[]>([])

  const esRef = useRef<EventSource|null>(null)

  // Init
  useEffect(() => {
    reloadEngines().then(first => { if(!engine) setEngine(first) })
    try { setRecentEngines(JSON.parse(localStorage.getItem('recentEngines')||'[]')) } catch {}
    return () => { esRef.current?.close() }
  },[])

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e:KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (['INPUT','SELECT','TEXTAREA'].includes(tag)) return
      if (e.key === '?' || e.key === '/') { setShowShortcuts(v=>!v); return }
      if (e.key === 'Escape') { setShowShortcuts(false); return }
      if (e.code === 'Space' && currentFileId && engine && !translating) { e.preventDefault(); startTranslation() }
      if ((e.ctrlKey||e.metaKey) && e.key==='r') { e.preventDefault(); if(!translating) resetAll() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  // Scroll wheel on batch size
  const batchWheelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = batchWheelRef.current
    if (!el) return
    const handler = (e:WheelEvent) => {
      e.preventDefault()
      setBatchSize(v => Math.max(1, Math.min(10, v + (e.deltaY < 0 ? 1 : -1))))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  },[])

  const trackEngine = (eng:string) => {
    const updated = [eng, ...recentEngines.filter(e=>e!==eng)].slice(0,3)
    setRecentEngines(updated)
    try { localStorage.setItem('recentEngines', JSON.stringify(updated)) } catch {}
  }

  const handleUpload = async (file:File) => {
    setUploading(true); setErrMsg(null)
    const fd = new FormData(); fd.append('file', file)
    try {
      const data = await fetch('/api/upload',{method:'POST',body:fd}).then(r=>r.json())
      if (data.success) {
        setCurrentFileId(data.file_id); setCurrentFileBlocks(data.blocks||0)
        setFileInfo({ filename:data.filename, saved_filename:data.saved_filename, size:data.size, type:data.file_type, detectedLang:data.detected_lang })
        setShowPreview(true); setLivePv(new Map())
        await loadPreview(data.file_id)
        if (data.detected_lang) setSourceLang(data.detected_lang)
        toast.success(`${(data.blocks||0).toLocaleString()} bloków · ${LANGUAGE_NAMES[data.detected_lang]||data.detected_lang||'?'}`, {icon:'🎬'})
      } else toast.error(data.error||'Upload failed')
    } catch { toast.error('Błąd połączenia') }
    finally { setUploading(false) }
  }

  const loadPreview = async (fileId:string) => {
    try {
      const data = await fetch(`/api/preview/${fileId}`).then(r=>r.json())
      if (data.success) setOrigPv(data.preview||[])
    } catch {}
  }

  const loadTranslatedPreview = async (taskId:string) => {
    try {
      const data = await fetch(`/api/preview/translated/${taskId}`).then(r=>r.json())
      if (data.success && data.preview?.length) { setTransPv(data.preview); setPvType('sidebyside') }
    } catch {}
  }

  const startTranslation = async () => {
    if (!currentFileId || !engine) return
    const cfg = engines[engine]
    if (!cfg?.enabled) { toast.error('Silnik wyłączony — skonfiguruj w ustawieniach'); return }
    if (!fileInfo?.saved_filename) { toast.error('Brak informacji o pliku'); return }

    trackEngine(engine)
    setTranslating(true); setSuccess(false); setProgress(0); setCurBlock(0)
    setErrMsg(null); setLivePv(new Map()); startTimer()

    try {
      const payload = { source_lang:sourceLang, target_lang:targetLang, engine, file_id:currentFileId, saved_filename:fileInfo.saved_filename, batch_size:batchSize, ...cfg }
      const data = await fetch('/api/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json())
      if (data.success) {
        setCurrentTaskId(data.task_id); setCurrentOutputFilename(data.output_filename)
        if (data.total_blocks) setCurrentFileBlocks(data.total_blocks)
        listenProgress(data.task_id, data.output_filename)  // pass directly, don't rely on state
        toast.success('Tłumaczenie rozpoczęte 🚀')
      } else { toast.error(data.error||'Błąd'); resetXl() }
    } catch { toast.error('Błąd połączenia'); resetXl() }
  }

  const listenProgress = (taskId:string, outputFilename:string) => {
    if (esRef.current) esRef.current.close()
    const es = new EventSource(`/api/progress/${taskId}`)
    esRef.current = es
    let retries = 0

    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data)
        retries = 0
        if (d.error) { toast.error(d.error); resetXl(); return }
        if (d.progress !== undefined) setProgress(d.progress)
        if (d.current !== undefined) setCurBlock(d.current)
        if (d.total > 0) setCurrentFileBlocks(d.total)
        if (d.block_id !== undefined && d.translated_text) {
          setLivePv(prev => { const m=new Map(prev); m.set(d.block_id, d.translated_text); return m })
        }
        if (d.completed) {
          es.close(); esRef.current = null
          incrementTotalTranslations(); stopTimer()
          setTimeout(async () => {
            setTranslating(false); setSuccess(true)
            await loadTranslatedPreview(taskId)
            // Pass outputFilename directly — don't rely on React state closure
            addHistory(outputFilename)
            toast.success('Gotowe! 🎬',{duration:4000})
          }, 400)
        }
      } catch {}
    }
    es.onerror = () => {
      retries++
      if (retries > 3) { toast.error('Połączenie SSE przerwane'); resetXl() }
    }
  }

  const resetXl = () => {
    setTranslating(false); setProgress(0); setCurBlock(0); resetTimer(); setLivePv(new Map())
    if (esRef.current) { esRef.current.close(); esRef.current = null }
  }

  const resetAll = () => {
    resetXl(); resetState(); setFileInfo(null); setShowPreview(false); setSuccess(false)
    setOrigPv([]); setTransPv([]); setLivePv(new Map()); setErrMsg(null)
  }

  const addHistory = (outputFilename: string) => {
    // Save to localStorage history
    try {
      const h = JSON.parse(localStorage.getItem('translationHistory')||'[]')
      const originalFilename = fileInfo?.filename || outputFilename || 'unknown'
      h.unshift({
        filename: outputFilename,
        originalFilename,
        engine, sourceLang, targetLang,
        blocks: currentFileBlocks,
        date: new Date().toISOString(),
        downloadUrl: `/download/${encodeURIComponent(outputFilename)}`,
      })
      if(h.length>20) h.pop()
      localStorage.setItem('translationHistory', JSON.stringify(h))
    } catch {}

    // Save to SQLite library (for local search)
    try {
      fetch('/api/library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orig_filename: fileInfo?.filename || outputFilename,
          output_filename: outputFilename,
          engine,
          source_lang: sourceLang,
          target_lang: targetLang,
          blocks: currentFileBlocks,
        }),
      }).catch(() => {}) // fire-and-forget
    } catch {}
  }

  const handleSaveConfig = async (eng:string, cfg:any) => {
    const ok = await saveConfig(eng, cfg)
    if (ok) { setCfgModal({open:false,engine:'',config:null}); toast.success('Konfiguracja zapisana') }
    else toast.error('Błąd zapisu')
  }

  const handleTestEngine = async (eng:string, cfg:any) => {
    setTestModal({open:true,loading:true,result:null})
    try {
      const data = await fetch('/api/test-connection',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({engine:eng,...cfg})}).then(r=>r.json())
      setTestModal({open:true,loading:false,result:data})
    } catch(err:any) { setTestModal({open:true,loading:false,result:{success:false,message:err.message}}) }
  }

  const liveArr     = origPv.map((_,i) => livePv.get(i+1)||'')
  const canTranslate = !!currentFileId && !!engine && !translating
  const estTime = currentFileBlocks > 0
    ? currentFileBlocks*.5 < 60 ? `~${Math.round(currentFileBlocks*.5)}s` : `~${Math.floor(currentFileBlocks*.5/60)}m`
    : '—'
  const liveCount = livePv.size

  return (
    <>
      {showShortcuts && <ShortcutsOverlay onClose={()=>setShowShortcuts(false)} />}

      <div className="bg-[var(--s1)] border border-[var(--border)] rounded-[var(--rxl)] overflow-hidden fade-in">
        {/* Accent top line */}
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--amber)] to-transparent opacity-25"></div>

        <div className="p-4 sm:p-5">

          {/* ── Progress ── */}
          {translating && (
            <div className="mb-4 space-y-2">
              <ProgressBar progress={progress} current={curBlock} total={currentFileBlocks} elapsedTime={fmt(elapsed)} engine={engine||undefined} />
              {/* Live counter */}
              {liveCount > 0 && (
                <div className="flex items-center gap-2 px-1 fade-in">
                  <div className="flex items-center gap-1.5">
                    {[0,1,2].map(i=><div key={i} className="w-1 h-3 bg-[var(--amber)] rounded-full wave-bar" style={{animationDelay:`${i*0.15}s`}}/>)}
                  </div>
                  <span className="font-mono text-[11px] text-[var(--muted)]">
                    <span className="text-[var(--amber)] font-semibold">{liveCount}</span> bloków przetłumaczonych na żywo
                  </span>
                </div>
              )}
              <button onClick={resetXl}
                className="w-full py-2 text-xs font-mono text-[var(--muted)] hover:text-[var(--red)] border border-[var(--border)] hover:border-[rgba(255,77,94,.25)] rounded-xl transition-all duration-200">
                <i className="bi bi-x-circle mr-1.5"></i>Anuluj tłumaczenie
              </button>
            </div>
          )}

          {/* ── Success ── */}
          {success && currentOutputFilename && (
            <div className="mb-4">
              <SuccessCard blocks={currentFileBlocks} elapsedTime={fmt(elapsed)} downloadUrl={`/download/${encodeURIComponent(currentOutputFilename)}`} onReset={resetAll} />
            </div>
          )}

          {/* ── Error ── */}
          {errMsg && (
            <div className="mb-4 flex items-start gap-3 bg-[var(--rdim)] border border-[rgba(255,77,94,.22)] rounded-[var(--rl)] p-3.5 slide-in">
              <i className="bi bi-exclamation-triangle text-[var(--red)] flex-shrink-0 mt-0.5"></i>
              <span className="text-xs text-[var(--text2)] flex-1 font-mono">{errMsg}</span>
              <button onClick={()=>setErrMsg(null)} className="text-[var(--muted)] hover:text-[var(--red)] flex-shrink-0">
                <i className="bi bi-x"></i>
              </button>
            </div>
          )}

          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">

            {/* LEFT */}
            <div className="flex flex-col gap-3">

              {/* File upload / info */}
              {!fileInfo ? (
                <FileUpload onUpload={handleUpload} isUploading={uploading} />
              ) : (
                <div className="bg-[var(--s2)] border border-[var(--border)] rounded-[var(--rl)] overflow-hidden slide-up">
                  {/* File header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-[11px] flex items-center justify-center text-sm bg-[var(--adim)] text-[var(--amber)] border border-[var(--adim2)]">
                        <i className="bi bi-file-earmark-text"></i>
                      </div>
                      {/* Format badge */}
                      <span className="absolute -bottom-1 -right-1 font-mono text-[8px] font-bold px-1 py-0.5 rounded border"
                        style={{background:'var(--s4)',borderColor:'var(--border2)',color:'var(--text2)'}}>
                        {fileInfo.type}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[var(--text)] truncate" title={fileInfo.filename}>
                        {fileInfo.filename}
                      </div>
                      <div className="font-mono text-[10px] text-[var(--muted)] mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{(fileInfo.size/1024).toFixed(1)} KB</span>
                        <span className="text-[var(--border2)]">·</span>
                        <span>{currentFileBlocks.toLocaleString()} bloków</span>
                        {fileInfo.detectedLang && <>
                          <span className="text-[var(--border2)]">·</span>
                          <span className="text-[var(--amber)]">{LANGUAGE_NAMES[fileInfo.detectedLang]||fileInfo.detectedLang}</span>
                        </>}
                      </div>
                    </div>
                    <button onClick={resetAll}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--red)] hover:bg-[var(--rdim)] border border-[var(--border)] transition-all text-xs flex-shrink-0"
                      title="Usuń plik">
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                  {/* Stats */}
                  <div className="p-3 bg-[var(--s3)]">
                    <StatsCards blocks={currentFileBlocks} chars={currentFileBlocks*52} estTime={estTime} />
                  </div>
                </div>
              )}

              {/* Recent engines hint */}
              {recentEngines.length > 0 && !translating && (
                <div className="flex items-center gap-2 fade-in">
                  <span className="font-mono text-[9px] text-[var(--muted)] uppercase tracking-widest flex-shrink-0">Ostatnio:</span>
                  {recentEngines.map(eng => (
                    <button key={eng} onClick={() => setEngine(eng as EK)}
                      className={`font-mono text-[10px] px-2 py-0.5 rounded-full border transition-all flex-shrink-0
                        ${engine===eng
                          ? 'text-[var(--amber)] border-[rgba(240,165,0,.35)] bg-[var(--adim)]'
                          : 'text-[var(--muted)] border-[var(--border)] hover:border-[var(--border2)] hover:text-[var(--text2)]'}`}>
                      {engines[eng]?.name || eng}
                    </button>
                  ))}
                </div>
              )}

              <EngineSelector engines={engines} selectedEngine={engine} onSelect={e=>setEngine(e as EK)} onOpenConfig={e=>setCfgModal({open:true,engine:e,config:engines[e]})} />
              <LanguageSelector sourceLang={sourceLang} targetLang={targetLang} onSourceChange={setSourceLang} onTargetChange={setTargetLang} detectedLang={fileInfo?.detectedLang} />

              {/* Advanced */}
              <div className="bg-[var(--s2)] border border-[var(--border)] rounded-[var(--rl)] overflow-hidden">
                <button onClick={()=>setShowAdv(!showAdv)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-mono text-[var(--muted)] hover:text-[var(--text2)] transition-colors">
                  <span className="flex items-center gap-2">
                    <i className="bi bi-sliders text-[var(--amber)]"></i>
                    Opcje zaawansowane
                  </span>
                  <i className={`bi bi-chevron-${showAdv?'up':'down'} text-xs transition-transform`}></i>
                </button>

                {showAdv && (
                  <div className="px-4 pb-4 border-t border-[var(--border)] pt-3 fade-in">
                    {/* Batch size — scroll wheel supported */}
                    <div ref={batchWheelRef}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-[var(--text2)] font-medium flex items-center gap-1.5">
                          <i className="bi bi-collection text-[var(--amber)]"></i>
                          Batch size
                          <span className="font-mono text-[9px] text-[var(--muted)] border border-[var(--border)] px-1.5 py-0.5 rounded ml-1">
                            scroll kółkiem
                          </span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button onClick={()=>setBatchSize(v=>Math.max(1,v-1))}
                            className="w-5 h-5 rounded flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] bg-[var(--s3)] border border-[var(--border)] text-xs transition-all">
                            −
                          </button>
                          <span className="font-mono text-base font-bold text-[var(--amber)] w-4 text-center">{batchSize}</span>
                          <button onClick={()=>setBatchSize(v=>Math.min(10,v+1))}
                            className="w-5 h-5 rounded flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] bg-[var(--s3)] border border-[var(--border)] text-xs transition-all">
                            +
                          </button>
                        </div>
                      </div>
                      <input type="range" min={1} max={10} value={batchSize}
                        onChange={e=>setBatchSize(Number(e.target.value))}
                        className="w-full h-1 appearance-none rounded-full cursor-pointer p-0 border-0"
                        style={{ accentColor:'var(--amber)', background:`linear-gradient(to right,var(--amber) ${(batchSize-1)/9*100}%,var(--s5) ${(batchSize-1)/9*100}%)` }} />
                      <div className="flex justify-between font-mono text-[9px] text-[var(--muted)] mt-1">
                        <span>1 — bezpieczny</span>
                        <span className="text-center text-[var(--amber)]">
                          {batchSize <= 2 ? 'Ollama: zalecane' : batchSize <= 5 ? 'Optymalne API' : 'Ryzyko: mieszanie linii'}
                        </span>
                        <span>10 — szybki</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Translate button ── */}
              <button onClick={startTranslation} disabled={!canTranslate}
                className={`w-full relative overflow-hidden rounded-[var(--rl)] py-4 font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200
                  ${canTranslate
                    ? 'text-[#0f0800] hover:-translate-y-0.5'
                    : 'bg-[var(--s3)] text-[var(--muted)] cursor-not-allowed border border-[var(--border)]'}`}
                style={canTranslate ? {
                  background: 'var(--amber)',
                  boxShadow: '0 8px 28px -8px rgba(240,165,0,0.6), inset 0 1px 0 rgba(255,255,255,0.2)'
                } : {}}>

                {/* Sheen animation on hover */}
                {canTranslate && (
                  <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                    style={{background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)'}}></div>
                )}

                <i className={`bi ${translating?'bi-hourglass-split':'bi-play-fill'} relative z-10`}></i>
                <span className="relative z-10 tracking-wide">
                  {translating ? 'Tłumaczenie…' : 'Tłumacz'}
                </span>
                {canTranslate && (
                  <kbd className="relative z-10 font-mono text-[10px] opacity-50 border border-[rgba(0,0,0,.25)] px-1.5 py-0.5 rounded">
                    SPACJA
                  </kbd>
                )}
              </button>

              {/* Shortcuts hint */}
              <div className="flex items-center justify-between px-1">
                <button onClick={()=>setShowShortcuts(true)}
                  className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--muted)] hover:text-[var(--text2)] transition-colors">
                  <kbd className="border border-[var(--border)] px-1.5 rounded text-[9px]">?</kbd>
                  <span>Skróty klawiszowe</span>
                </button>
                {!translating && currentFileId && (
                  <button onClick={resetAll}
                    className="font-mono text-[10px] text-[var(--muted)] hover:text-[var(--red)] transition-colors flex items-center gap-1">
                    <i className="bi bi-arrow-counterclockwise text-xs"></i>Reset
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex flex-col gap-3">
              {showPreview && (
                <PreviewPanel
                  previewData={origPv} type={pvType}
                  originalData={origPv} translatedData={translating ? liveArr : transPv}
                  onTypeChange={setPvType} showToggle={transPv.length>0||livePv.size>0} isLive={translating} />
              )}

              {/* Info / tips */}
              <div className="bg-[var(--s2)] border border-[var(--border)] rounded-[var(--rl)] overflow-hidden">
                <div className="h-px bg-gradient-to-r from-transparent via-[var(--adim2)] to-transparent"></div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="bi bi-info-circle text-[var(--amber)] text-sm"></i>
                    <span className="text-xs font-semibold text-[var(--text2)] tracking-wide">INFO</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { icon:'bi-film',     text:'SRT · ASS · SSA · VTT',          color:'var(--amber)' },
                      { icon:'bi-translate',text:'Auto-detect języka źródłowego',   color:'var(--blue)'  },
                      { icon:'bi-eye',      text:'Podgląd na żywo podczas tłum.',   color:'var(--green)' },
                      { icon:'bi-cpu',      text:'11 silników AI — local + cloud',  color:'var(--purple)'},
                      { icon:'bi-shield',   text:'Dane zostają lokalnie (local AI)', color:'var(--cyan)'  },
                    ].map(({icon,text,color},i) => (
                      <div key={i} className="flex items-start gap-2.5 text-[11px] text-[var(--muted)]">
                        <i className={`bi ${icon} text-xs mt-0.5 flex-shrink-0`} style={{color}}></i>
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent"></div>
      </div>

      <ConfigModal isOpen={cfgModal.open} onClose={()=>setCfgModal({open:false,engine:'',config:null})}
        engine={cfgModal.engine} config={cfgModal.config} onSave={handleSaveConfig} onTest={handleTestEngine} />
      <TestModal isOpen={testModal.open} onClose={()=>setTestModal({open:false,loading:false,result:null})}
        result={testModal.result} isLoading={testModal.loading} />
    </>
  )
}
