'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface TMEntry {
  id: string
  find: string
  replace: string
  enabled: boolean
  note?: string
}

const PRESETS: TMEntry[] = [
  { id:'p1', find:'Breaking Bad',  replace:'Breaking Bad',  enabled:false, note:'Zachowaj tytuł oryginalny' },
  { id:'p2', find:'Game of Thrones',replace:'Game of Thrones',enabled:false, note:'Zachowaj tytuł' },
  { id:'p3', find:'\\bOK\\b',      replace:'OK',            enabled:false, note:'Nie tłumacz "OK"' },
]

export default function TranslationMemory() {
  const [entries, setEntries] = useState<TMEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [newFind, setNewFind] = useState('')
  const [newRepl, setNewRepl] = useState('')
  const [newNote, setNewNote] = useState('')
  const [saving,  setSaving]  = useState(false)
  const [dirty,   setDirty]   = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const d = await fetch('/api/tm').then(r=>r.json())
      if (d.success) setEntries(d.entries || [])
    } catch {}
    setLoading(false)
  }

  const save = async (newEntries: TMEntry[]) => {
    setSaving(true)
    try {
      await fetch('/api/tm', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ entries: newEntries })
      })
      setDirty(false)
      toast.success('Pamięć tłumaczeniowa zapisana')
    } catch { toast.error('Błąd zapisu') }
    setSaving(false)
  }

  const addEntry = () => {
    if (!newFind.trim()) { toast.error('Wpisz szukaną frazę'); return }
    const entry: TMEntry = {
      id: Date.now().toString(),
      find: newFind.trim(),
      replace: newRepl.trim(),
      enabled: true,
      note: newNote.trim() || undefined,
    }
    const updated = [...entries, entry]
    setEntries(updated); setNewFind(''); setNewRepl(''); setNewNote('')
    save(updated)
  }

  const toggle = (id:string) => {
    const updated = entries.map(e => e.id===id ? {...e, enabled:!e.enabled} : e)
    setEntries(updated); save(updated)
  }

  const remove = (id:string) => {
    const updated = entries.filter(e=>e.id!==id)
    setEntries(updated); save(updated)
  }

  const addPreset = (preset: TMEntry) => {
    if (entries.find(e=>e.find===preset.find)) { toast('Reguła już istnieje'); return }
    const updated = [...entries, {...preset, id:Date.now().toString(), enabled:true}]
    setEntries(updated); save(updated)
  }

  const enabledCount = entries.filter(e=>e.enabled).length

  return (
    <div className="fade-in">
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--purple)] to-transparent opacity-20"></div>

      <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {enabledCount>0 && (
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border"
              style={{color:'var(--purple)',borderColor:'rgba(181,123,255,.3)',background:'rgba(181,123,255,.1)'}}>
              {enabledCount} aktywnych reguł
            </span>
          )}
          {enabledCount===0 && <span className="font-mono text-[10px] text-[var(--muted)]">Brak aktywnych reguł</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-[var(--muted)]">stosowane po każdym tłumaczeniu</span>
        </div>
      </div>

    <div className="p-4 space-y-4">

        {/* Add new rule */}
        <div className="bg-[var(--s2)] border border-[var(--border)] rounded-[var(--rl)] p-4">
          <div className="font-mono text-[10px] text-[var(--muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <i className="bi bi-plus-circle text-[var(--purple)]"></i>Nowa reguła
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <div>
              <label className="font-mono text-[10px] text-[var(--muted)] block mb-1">Znajdź (w tłumaczeniu)</label>
              <input value={newFind} onChange={e=>setNewFind(e.target.value)}
                placeholder='np. "Szary" albo regex: \bOK\b'
                onKeyDown={e=>e.key==='Enter'&&addEntry()}
                className="w-full text-xs py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--s3)]"/>
            </div>
            <div>
              <label className="font-mono text-[10px] text-[var(--muted)] block mb-1">Zamień na</label>
              <input value={newRepl} onChange={e=>setNewRepl(e.target.value)}
                placeholder='np. "Grey" albo "OK"'
                onKeyDown={e=>e.key==='Enter'&&addEntry()}
                className="w-full text-xs py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--s3)]"/>
            </div>
          </div>
          <div className="flex gap-2">
            <input value={newNote} onChange={e=>setNewNote(e.target.value)}
              placeholder="Komentarz (opcjonalny)"
              className="flex-1 text-xs py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--s3)]"/>
            <button onClick={addEntry}
              className="flex items-center gap-1.5 font-semibold text-xs px-4 py-2 rounded-lg transition-all"
              style={{background:'rgba(181,123,255,.15)',color:'var(--purple)',border:'1px solid rgba(181,123,255,.3)'}}>
              <i className="bi bi-plus"></i>Dodaj
            </button>
          </div>
        </div>

        {/* Presets */}
        {PRESETS.length>0 && entries.length===0 && (
          <div className="bg-[var(--s2)] border border-[var(--border)] rounded-[var(--rl)] p-3">
            <div className="font-mono text-[10px] text-[var(--muted)] uppercase tracking-wider mb-2">Szybkie przykłady</div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button key={p.id} onClick={()=>addPreset(p)}
                  className="font-mono text-[10px] px-2.5 py-1 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:border-[var(--border2)] hover:text-[var(--purple)] transition-all flex items-center gap-1">
                  <i className="bi bi-plus text-[9px]"></i>
                  {p.find} → {p.replace}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rules list */}
        {loading ? (
          <div className="text-center py-6 font-mono text-xs text-[var(--muted)]">
            <span className="w-4 h-4 border border-t-[var(--purple)] border-[var(--border)] rounded-full animate-spin inline-block"></span>
          </div>
        ) : entries.length===0 ? (
          <div className="text-center py-8">
            <i className="bi bi-book block text-3xl text-[var(--dim)] mb-2"></i>
            <p className="font-mono text-xs text-[var(--muted)]">Brak reguł — dodaj pierwszą powyżej</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {entries.map(entry => (
              <div key={entry.id}
                className={`flex items-start gap-3 p-3 rounded-[var(--rl)] border transition-all group ${entry.enabled ? 'bg-[var(--s2)] border-[var(--border)]' : 'bg-[var(--s3)] border-[var(--border)] opacity-50'}`}>

                {/* Toggle */}
                <button onClick={()=>toggle(entry.id)}
                  className={`w-8 h-5 rounded-full transition-all flex-shrink-0 mt-0.5 relative ${entry.enabled?'bg-[var(--purple)]':'bg-[var(--s5)]'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${entry.enabled?'left-3':'left-0.5'}`}></span>
                </button>

                {/* Rule */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="font-mono text-[11px] bg-[var(--s4)] border border-[var(--border)] px-2 py-0.5 rounded text-[var(--amber)]">{entry.find}</code>
                    <i className="bi bi-arrow-right text-[var(--muted)] text-xs flex-shrink-0"></i>
                    <code className="font-mono text-[11px] bg-[var(--s4)] border border-[var(--border)] px-2 py-0.5 rounded text-[var(--green)]">{entry.replace || '(usuń)'}</code>
                  </div>
                  {entry.note && <p className="font-mono text-[10px] text-[var(--muted)] mt-1">{entry.note}</p>}
                </div>

                {/* Delete */}
                <button onClick={()=>remove(entry.id)}
                  className="w-6 h-6 rounded flex items-center justify-center text-[var(--muted)] hover:text-[var(--red)] hover:bg-[var(--rdim)] opacity-0 group-hover:opacity-100 transition-all text-xs flex-shrink-0">
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            ))}
          </div>
        )}

        {entries.length>0 && (
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <span className="font-mono text-[10px] text-[var(--muted)]">{entries.length} reguł · {enabledCount} aktywnych</span>
            <button onClick={()=>{ if(confirm('Usunąć wszystkie reguły?')){ setEntries([]); save([]) }}}
              className="font-mono text-[10px] text-[var(--muted)] hover:text-[var(--red)] transition-colors flex items-center gap-1">
              <i className="bi bi-trash text-[9px]"></i>Usuń wszystkie
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
