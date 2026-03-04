'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
interface Props { isOpen:boolean; onClose:()=>void; engine:string; config:any; onSave:(e:string,c:any)=>void; onTest:(e:string,c:any)=>void }
const STYLES: Record<string,{icon:string;color:string;bg:string}> = {
  libretranslate:{icon:'bi-globe',    color:'#60a5fa',bg:'rgba(96,165,250,.14)'},
  googlegtx:    {icon:'bi-google',   color:'#60a5fa',bg:'rgba(96,165,250,.14)'},
  ollama:       {icon:'bi-robot',    color:'#c084fc',bg:'rgba(192,132,252,.14)'},
  deeplx:       {icon:'bi-translate',color:'#f472b6',bg:'rgba(244,114,182,.14)'},
  deepseek:     {icon:'bi-cpu',      color:'#22d3ee',bg:'rgba(34,211,238,.14)'},
  openai:       {icon:'bi-bolt',     color:'#fbbf24',bg:'rgba(251,191,36,.14)'},
  anthropic:    {icon:'bi-chat-dots',color:'#fb923c',bg:'rgba(251,146,60,.14)'},
  azure:        {icon:'bi-cloud',    color:'#38bdf8',bg:'rgba(56,189,248,.14)'},
  google:       {icon:'bi-google',   color:'#4ade80',bg:'rgba(74,222,128,.14)'},
  deepl:        {icon:'bi-rocket',   color:'#a78bfa',bg:'rgba(167,139,250,.14)'},
  custom:       {icon:'bi-code',     color:'#94a3b8',bg:'rgba(148,163,184,.14)'},
}
const Field = ({ label, icon, children, hint }: { label:string; icon:string; children:React.ReactNode; hint?:string }) => (
  <div className="mb-4">
    <label className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--muted)] mb-1.5">
      <i className={`bi ${icon} text-[var(--amber)] text-xs`}></i>{label}
    </label>
    {children}
    {hint && <p className="text-[10px] text-[var(--muted)] mt-1">{hint}</p>}
  </div>
)
export default function ConfigModal({ isOpen, onClose, engine, config, onSave, onTest }: Props) {
  const [local, setLocal] = useState<any>(config||{})
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true); return ()=>setMounted(false) }, [])
  useEffect(() => { if(config) setLocal(config) }, [config])
  if (!isOpen || !mounted) return null
  const st = STYLES[engine] || {icon:'bi-cpu',color:'#94a3b8',bg:'rgba(148,163,184,.14)'}
  const inp = (field:string, type='text', placeholder='') => (
    <input type={type} value={local[field]||''} placeholder={placeholder}
      onChange={e => setLocal({...local,[field]:e.target.value})} />
  )
  const renderFields = () => {
    switch(engine) {
      case 'libretranslate': return <Field label="Server URL" icon="bi-server" hint="np. http://localhost:5010">{inp('server','text','http://localhost:5010')}</Field>
      case 'deeplx': return <>
        <Field label="Server URL" icon="bi-server">{inp('server','text','http://localhost:1188')}</Field>
        <Field label="Token (opcjonalnie)" icon="bi-key">{inp('token','password','Bearer token')}</Field>
      </>
      case 'ollama': return <>
        <Field label="Server URL" icon="bi-server" hint="np. http://192.168.1.10:11434">{inp('server','text','http://localhost:11434')}</Field>
        <Field label="Model" icon="bi-cpu" hint="Sprawdź dostępne: ollama list">
          <input type="text" value={local.model||''} placeholder="np. llama3.2:latest, gemma3:4b"
            onChange={e => setLocal({...local,model:e.target.value})} />
        </Field>
      </>
      case 'deepseek': return <>
        <Field label="API Key" icon="bi-key">{inp('api_key','password','sk-...')}</Field>
        <Field label="Model" icon="bi-cpu">{inp('model','text','deepseek-chat')}</Field>
      </>
      case 'openai': return <>
        <Field label="API Key" icon="bi-key" hint="Z openrouter.ai/keys">{inp('api_key','password','sk-or-...')}</Field>
        <Field label="Model" icon="bi-cpu">{inp('model','text','meta-llama/llama-3.2-3b-instruct:free')}</Field>
      </>
      case 'anthropic': return <>
        <Field label="API Key" icon="bi-key">{inp('api_key','password','sk-ant-...')}</Field>
        <Field label="Model" icon="bi-cpu">{inp('model','text','claude-3-haiku-20240307')}</Field>
      </>
      case 'azure': return <>
        <Field label="API Key" icon="bi-key">{inp('api_key','password','')}</Field>
        <Field label="Endpoint" icon="bi-server">{inp('endpoint','text','https://api.cognitive.microsofttranslator.com')}</Field>
        <Field label="Region" icon="bi-geo">{inp('region','text','westeurope')}</Field>
      </>
      case 'google': return <Field label="API Key" icon="bi-key" hint="Z Google Cloud Console">{inp('api_key','password','')}</Field>
      case 'deepl': return <>
        <Field label="Auth Key" icon="bi-key" hint="Kończy się na :fx dla Free">{inp('auth_key','password','')}</Field>
        <Field label="Typ konta" icon="bi-badge">
          <select value={local.type||'free'} onChange={e=>setLocal({...local,type:e.target.value})}>
            <option value="free">Free</option><option value="pro">Pro</option>
          </select>
        </Field>
      </>
      case 'custom': return <>
        <Field label="API URL" icon="bi-link">{inp('api_url','text','https://api.example.com/v1/chat/completions')}</Field>
        <Field label="API Key (opcjonalnie)" icon="bi-key">{inp('api_key','password','')}</Field>
        <Field label="Model" icon="bi-cpu">{inp('model','text','model-name')}</Field>
      </>
      case 'googlegtx': return <div className="p-3 bg-[var(--gdim)] border border-[rgba(43,189,126,.2)] rounded-xl text-xs text-[var(--text2)]">
        <i className="bi bi-check-circle text-[var(--green)] mr-1.5"></i>Bez konfiguracji — bezpłatne publiczne API Google
      </div>
      default: return <div className="text-xs text-[var(--muted)] py-2">Brak ustawień dla tego silnika.</div>
    }
  }
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-[var(--s2)] border border-[var(--border2)] rounded-[var(--rxl)] w-full max-w-md shadow-[0_30px_60px_-15px_rgba(0,0,0,.8)] pop-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[11px] flex items-center justify-center text-base" style={{ background:st.bg, color:st.color }}>
              <i className={`bi ${st.icon}`}></i>
            </div>
            <div>
              <h5 className="text-sm font-semibold text-[var(--text)]">{config?.name || engine}</h5>
              <p className="text-[10px] text-[var(--muted)] font-mono">Konfiguracja silnika</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-[var(--s3)] hover:bg-[var(--s4)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] flex items-center justify-center text-sm transition-all">
            <i className="bi bi-x"></i>
          </button>
        </div>
        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* Enable toggle */}
          <div className="flex items-center justify-between mb-4 p-3 bg-[var(--s3)] rounded-xl border border-[var(--border)]">
            <div>
              <p className="text-xs font-semibold text-[var(--text)]">Status silnika</p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">{local.enabled !== false ? 'Aktywny — pojawia się na liście' : 'Wyłączony — nie jest dostępny'}</p>
            </div>
            <button onClick={() => setLocal({...local,enabled:!(local.enabled!==false)})}
              className={`relative w-11 h-6 rounded-full transition-all duration-200 ${local.enabled!==false ? 'bg-[var(--amber)]' : 'bg-[var(--s5)]'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${local.enabled!==false ? 'left-[calc(100%-22px)]' : 'left-0.5'}`}></div>
            </button>
          </div>
          <hr className="border-[var(--border)] mb-4" />
          {renderFields()}
        </div>
        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2 flex-shrink-0">
          <button onClick={() => onSave(engine, local)}
            className="flex-1 bg-[var(--amber)] hover:bg-[var(--amber2)] text-[#1a0e00] font-semibold text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200">
            <i className="bi bi-save"></i>Zapisz
          </button>
          <button onClick={() => onTest(engine, local)}
            className="flex-1 border border-[var(--border2)] bg-[var(--s3)] hover:bg-[var(--s4)] text-[var(--text2)] font-semibold text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200">
            <i className="bi bi-plug"></i>Testuj
          </button>
        </div>
      </div>
    </div>, document.body
  )
}
