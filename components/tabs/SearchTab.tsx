'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface LibraryEntry { id:number; norm_title:string; orig_filename:string; engine:string; target_lang:string; blocks:number; download_url:string }
interface RecentEntry  { id:number; norm_title:string; target_lang:string; engine:string }

const LANGS = [
  {v:'',l:'Wszystkie'},  {v:'pl',l:'🇵🇱 Polski'},   {v:'en',l:'🇬🇧 Angielski'},
  {v:'de',l:'🇩🇪 Niemiec'},{v:'fr',l:'🇫🇷 Francuski'},{v:'es',l:'🇪🇸 Hiszpański'},
  {v:'it',l:'🇮🇹 Włoski'}, {v:'ru',l:'🇷🇺 Rosyjski'},{v:'uk',l:'🇺🇦 Ukraiński'},
]

export default function SearchTab() {
  const [tab, setTab]         = useState<'local'|'online'>('local')
  const [query, setQuery]     = useState('')
  const [lang, setLang]       = useState('pl')
  const [results, setResults] = useState<LibraryEntry[]>([])
  const [recent, setRecent]   = useState<RecentEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey]   = useState('')
  const [hasSaved, setHasSaved] = useState(false)

  useEffect(() => { loadRecent(); const k=localStorage.getItem('openSubsApiKey'); if(k){setApiKey(k);setHasSaved(true)} }, [])

  const loadRecent = async () => {
    try { const d=await fetch('/api/library/recent').then(r=>r.json()); if(d.success)setRecent(d.results) } catch {}
  }

  const handleSearch = async () => {
    if (!query.trim()) { toast.error('Wpisz tytuł'); return }
    setLoading(true); setResults([])
    if (tab === 'local') {
      try {
        const d = await fetch(`/api/library/search?q=${encodeURIComponent(query)}&lang=${lang}`).then(r=>r.json())
        if(d.success)setResults(d.results)
        else toast.error('Błąd wyszukiwania')
      } catch { toast.error('Błąd połączenia') }
    } else {
      const key = apiKey || localStorage.getItem('openSubsApiKey') || ''
      if (!key) { toast.error('Brak klucza API OpenSubtitles'); setLoading(false); return }
      try {
        const d = await fetch('/api/subtitles/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query,target_lang:lang||'pl',api_key:key})}).then(r=>r.json())
        if(d.success){
          if(d.results?.[0]?.error){toast.error(d.results[0].error)}
          else setResults(d.results.map((r:any)=>({id:r.file_id,norm_title:r.movie_name||r.title||query,orig_filename:r.file_name||'',engine:'OpenSubtitles',target_lang:r.lang,blocks:0,download_url:`https://www.opensubtitles.com/pl/download/subtitle/${r.file_id}`})))
        }
      } catch { toast.error('Błąd OpenSubtitles') }
    }
    setLoading(false)
  }

  const handleDelete = async (id:number) => {
    if (!confirm('Usunąć z biblioteki?')) return
    try { await fetch(`/api/library/delete/${id}`,{method:'DELETE'}); setResults(prev=>prev.filter(r=>r.id!==id)); loadRecent(); toast.success('Usunięto') } catch { toast.error('Błąd') }
  }

  const saveKey = () => { if(!apiKey.trim()){toast.error('Brak klucza');return}; localStorage.setItem('openSubsApiKey',apiKey); setHasSaved(true); toast.success('Klucz zapisany') }
  const clearKey = () => { localStorage.removeItem('openSubsApiKey'); setApiKey(''); setHasSaved(false); toast.success('Klucz usunięty') }

  return (
    <div className="bg-[var(--s1)] border border-[var(--border)] rounded-[var(--rxl)] overflow-hidden fade-in">
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--amber)] to-transparent opacity-20"></div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Search bar */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] text-xs pointer-events-none"></i>
            <input type="text" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearch()}
              placeholder="Tytuł: Dune, Breaking Bad S01E01…" className="pl-8" />
          </div>
          <select value={lang} onChange={e=>setLang(e.target.value)} className="w-36">
            {LANGS.map(l=><option key={l.v} value={l.v}>{l.l}</option>)}
          </select>
          <button onClick={handleSearch} disabled={loading}
            className="flex items-center gap-2 bg-[var(--amber)] hover:bg-[var(--amber2)] text-[#1a0e00] font-semibold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 whitespace-nowrap">
            <i className="bi bi-search text-xs"></i>Szukaj
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 bg-[var(--s2)] border border-[var(--border)] rounded-full p-1 w-fit">
          {[{id:'local',icon:'bi-hdd',label:'Biblioteka'},{id:'online',icon:'bi-globe',label:'OpenSubtitles'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id as any)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200
                ${tab===t.id ? 'bg-[var(--s4)] text-[var(--amber)]' : 'text-[var(--muted)] hover:text-[var(--text2)]'}`}>
              <i className={`bi ${t.icon}`}></i>{t.label}
            </button>
          ))}
        </div>

        {/* API key row (online only) */}
        {tab==='online' && (
          <div className={`p-3 rounded-xl border ${hasSaved ? 'bg-[var(--gdim)] border-[rgba(43,189,126,.25)]' : 'bg-[var(--adim)] border-[var(--adim2)]'}`}>
            {hasSaved ? (
              <div className="flex items-center gap-3">
                <i className="bi bi-check-circle-fill text-[var(--green)]"></i>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-[var(--green)]">Klucz API zapisany</div>
                  <div className="text-[10px] text-[var(--muted)]">Przechowywany lokalnie w przeglądarce</div>
                </div>
                <button onClick={clearKey} className="text-[var(--red)] border border-[rgba(230,57,70,.3)] bg-[var(--rdim)] hover:bg-[rgba(230,57,70,.2)] text-xs px-3 py-1.5 rounded-lg font-semibold transition-all">
                  <i className="bi bi-x mr-1"></i>Usuń
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <i className="bi bi-key-fill text-[var(--amber)] flex-shrink-0"></i>
                  <input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} onKeyDown={e=>e.key==='Enter'&&saveKey()}
                    placeholder="Klucz z opensubtitles.com/consumers" className="flex-1" />
                  <button onClick={saveKey} className="bg-[var(--amber)] text-[#1a0e00] font-bold text-xs px-3 py-2 rounded-lg whitespace-nowrap">Zapisz</button>
                </div>
                <p className="text-[10px] text-[var(--muted)]">
                  Klucz API ≠ JWT token — nie zaczyna się od „ey…" · <a href="https://www.opensubtitles.com/consumers" target="_blank" className="text-[var(--amber)] hover:underline">Pobierz klucz</a>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        <div className="min-h-[160px]">
          {loading ? (
            <div className="text-center py-10">
              <div className="flex items-end gap-0.5 h-8 justify-center mb-3">
                {[60,100,75,100,55].map((h,i)=><span key={i} className="wave-bar" style={{height:`${h}%`,animationDelay:`${i*.12}s`}}></span>)}
              </div>
              <p className="text-sm text-[var(--muted)]">{tab==='online'?'Odpytuje OpenSubtitles…':'Przeszukuję bibliotekę…'}</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.map(r=>(
                <div key={r.id} className="bg-[var(--s2)] border border-[var(--border)] hover:border-[var(--border2)] rounded-[var(--rl)] p-4 transition-all duration-200">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 flex-shrink-0 rounded-[10px] bg-[var(--adim)] text-[var(--amber)] flex items-center justify-center text-sm">
                      <i className="bi bi-file-earmark-text"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[var(--text)] break-words">{r.norm_title}</div>
                      <div className="font-mono text-[10px] text-[var(--muted)] mt-0.5">{r.engine} · {r.target_lang.toUpperCase()}{r.blocks>0?` · ${r.blocks} bl.`:''}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={r.download_url} target={r.engine==='OpenSubtitles'?'_blank':undefined} rel="noopener noreferrer"
                      className="flex-1 bg-[var(--green)] hover:bg-[#22a76d] text-[#071a11] font-bold text-xs text-center py-2 px-3 rounded-xl no-underline transition-all">
                      <i className="bi bi-download mr-1"></i>Pobierz
                    </a>
                    {r.engine!=='OpenSubtitles' && (
                      <button onClick={()=>handleDelete(r.id)}
                        className="bg-[var(--rdim)] border border-[rgba(230,57,70,.25)] text-[var(--red)] hover:bg-[rgba(230,57,70,.2)] py-2 px-3 rounded-xl text-xs transition-all">
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="text-center py-10 text-[var(--muted)]">
              <i className="bi bi-search text-4xl block mb-3 text-[var(--dim)]"></i>
              <p className="text-sm">Brak wyników dla „<span className="text-[var(--text2)]">{query}</span>"</p>
              <p className="text-xs mt-1">Spróbuj innego tytułu lub języka</p>
            </div>
          ) : (
            <div className="text-center py-10 text-[var(--muted)]">
              <i className="bi bi-collection text-4xl block mb-3 text-[var(--dim)]"></i>
              <p className="text-sm">Wpisz tytuł aby wyszukać napisy</p>
            </div>
          )}
        </div>

        {/* Recent */}
        {recent.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest text-[var(--muted)] mb-3">
              <i className="bi bi-clock text-[var(--amber)]"></i>
              <span>Ostatnio przetłumaczone</span>
              <div className="flex-1 h-px bg-[var(--border)]"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {recent.map(e=>(
                <div key={e.id} onClick={()=>{setQuery(e.norm_title);setTab('local')}}
                  className="bg-[var(--s2)] border border-[var(--border)] hover:border-[var(--amber)] rounded-xl p-3 cursor-pointer transition-all duration-200 group">
                  <div className="text-xs font-semibold text-[var(--text)] truncate group-hover:text-[var(--amber)] transition-colors">{e.norm_title}</div>
                  <div className="flex gap-1.5 items-center mt-1.5">
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full border border-[var(--adim2)] bg-[var(--adim)] text-[var(--amber)]">{e.target_lang.toUpperCase()}</span>
                    <span className="text-[9px] text-[var(--muted)] truncate">{e.engine}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
