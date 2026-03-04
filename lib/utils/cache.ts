/**
 * Translation Cache — LRU cache w pamięci + localStorage fallback
 * Zapobiega ponownemu tłumaczeniu tych samych bloków tekstu tym samym silnikiem
 */

interface CacheEntry {
  translated: string
  engine: string
  timestamp: number
}

const CACHE_KEY = 'sf_translation_cache'
const MAX_ENTRIES = 5000
const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 dni

class TranslationCache {
  private mem = new Map<string, CacheEntry>()
  private loaded = false

  private load() {
    if (this.loaded) return
    this.loaded = true
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (!raw) return
      const data: Record<string, CacheEntry> = JSON.parse(raw)
      const now = Date.now()
      Object.entries(data).forEach(([k, v]) => {
        if (now - v.timestamp < TTL_MS) this.mem.set(k, v)
      })
    } catch {}
  }

  private save() {
    try {
      const obj: Record<string, CacheEntry> = {}
      this.mem.forEach((v, k) => { obj[k] = v })
      localStorage.setItem(CACHE_KEY, JSON.stringify(obj))
    } catch {}
  }

  private key(text: string, engine: string, src: string, tgt: string) {
    return `${engine}:${src}:${tgt}:${text}`
  }

  get(text: string, engine: string, src: string, tgt: string): string | null {
    this.load()
    const entry = this.mem.get(this.key(text, engine, src, tgt))
    if (!entry) return null
    if (Date.now() - entry.timestamp > TTL_MS) {
      this.mem.delete(this.key(text, engine, src, tgt))
      return null
    }
    return entry.translated
  }

  set(text: string, engine: string, src: string, tgt: string, translated: string) {
    this.load()
    if (this.mem.size >= MAX_ENTRIES) {
      // Evict oldest 10%
      const entries = [...this.mem.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)
      entries.slice(0, Math.floor(MAX_ENTRIES * 0.1)).forEach(([k]) => this.mem.delete(k))
    }
    this.mem.set(this.key(text, engine, src, tgt), { translated, engine, timestamp: Date.now() })
    this.save()
  }

  stats() {
    this.load()
    return { entries: this.mem.size, maxEntries: MAX_ENTRIES }
  }

  clear() {
    this.mem.clear()
    try { localStorage.removeItem(CACHE_KEY) } catch {}
  }
}

export const translationCache = typeof window !== 'undefined' ? new TranslationCache() : null
