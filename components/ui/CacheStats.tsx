'use client'
import { useState, useEffect } from 'react'
import { translationCache } from '@/lib/utils/cache'

export default function CacheStats() {
  const [stats, setStats] = useState<{entries:number;maxEntries:number}|null>(null)
  const [showClear, setShowClear] = useState(false)

  useEffect(() => {
    if (!translationCache) return
    const update = () => setStats(translationCache.stats())
    update()
    const id = setInterval(update, 5000)
    return () => clearInterval(id)
  }, [])

  if (!stats || stats.entries === 0) return null

  const pct = Math.round((stats.entries / stats.maxEntries) * 100)

  return (
    <div className="flex items-center gap-2 bg-[var(--s2)] border border-[var(--border)] rounded-full px-3 py-1.5 text-[10px] font-mono">
      <i className="bi bi-lightning-charge text-[var(--amber)]"></i>
      <span className="text-[var(--text2)]">Cache: <span className="text-[var(--amber)]">{stats.entries}</span> wpisów</span>
      <div className="w-16 h-1 bg-[var(--s4)] rounded-full overflow-hidden">
        <div className="h-full bg-[var(--amber)] rounded-full transition-all" style={{ width: `${pct}%` }}></div>
      </div>
      <button
        onClick={() => { translationCache?.clear(); setStats({entries:0,maxEntries:stats.maxEntries}) }}
        className="text-[var(--muted)] hover:text-[var(--red)] transition-colors ml-1"
        title="Wyczyść cache tłumaczeń"
      >
        <i className="bi bi-x"></i>
      </button>
    </div>
  )
}
