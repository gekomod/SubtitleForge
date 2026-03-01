import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const CACHE_DB_PATH = process.env.CACHE_DB_PATH || path.join(process.cwd(), 'data', 'cache.db')

// Ensure directory exists
const dbDir = path.dirname(CACHE_DB_PATH)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(CACHE_DB_PATH)

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS translation_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_text TEXT NOT NULL,
    source_lang TEXT NOT NULL,
    target_lang TEXT NOT NULL,
    engine TEXT NOT NULL,
    engine_config TEXT,
    translated_text TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    hits INTEGER DEFAULT 1,
    UNIQUE(source_text, source_lang, target_lang, engine, engine_config)
  )
`)

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_cache_lookup ON translation_cache(source_text, source_lang, target_lang, engine);
  CREATE INDEX IF NOT EXISTS idx_cache_created_at ON translation_cache(created_at);
`)

export interface CacheEntry {
  id: number
  source_text: string
  source_lang: string
  target_lang: string
  engine: string
  engine_config: string | null
  translated_text: string
  created_at: number
  hits: number
}

export function getCachedTranslation(
  sourceText: string,
  sourceLang: string,
  targetLang: string,
  engine: string,
  engineConfig: any = null
): string | null {
  try {
    const configStr = engineConfig ? JSON.stringify(engineConfig) : null
    
    const stmt = db.prepare(`
      SELECT translated_text, hits FROM translation_cache
      WHERE source_text = ? AND source_lang = ? AND target_lang = ? AND engine = ? 
        AND (engine_config IS ? OR engine_config = ?)
      LIMIT 1
    `)
    
    const result = stmt.get(sourceText, sourceLang, targetLang, engine, configStr, configStr) as { translated_text: string, hits: number } | undefined
    
    if (result) {
      // Update hit count
      const updateStmt = db.prepare(`
        UPDATE translation_cache SET hits = hits + 1
        WHERE source_text = ? AND source_lang = ? AND target_lang = ? AND engine = ?
      `)
      updateStmt.run(sourceText, sourceLang, targetLang, engine)
      
      return result.translated_text
    }
    
    return null
  } catch (error) {
    console.error('Error getting cached translation:', error)
    return null
  }
}

export function saveToCache(
  sourceText: string,
  sourceLang: string,
  targetLang: string,
  engine: string,
  translatedText: string,
  engineConfig: any = null
): boolean {
  try {
    const configStr = engineConfig ? JSON.stringify(engineConfig) : null
    const now = Math.floor(Date.now() / 1000)
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO translation_cache 
      (source_text, source_lang, target_lang, engine, engine_config, translated_text, created_at, hits)
      VALUES (?, ?, ?, ?, ?, ?, ?, 
        COALESCE((SELECT hits + 1 FROM translation_cache 
                  WHERE source_text = ? AND source_lang = ? AND target_lang = ? AND engine = ?), 1)
      )
    `)
    
    stmt.run(
      sourceText, sourceLang, targetLang, engine, configStr, translatedText, now,
      sourceText, sourceLang, targetLang, engine
    )
    
    return true
  } catch (error) {
    console.error('Error saving to cache:', error)
    return false
  }
}

export function getCacheStats() {
  try {
    const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM translation_cache`)
    const total = totalStmt.get() as { count: number }
    
    const hitsStmt = db.prepare(`SELECT SUM(hits) as total_hits FROM translation_cache`)
    const hits = hitsStmt.get() as { total_hits: number }
    
    const sizeStmt = db.prepare(`SELECT SUM(LENGTH(source_text) + LENGTH(translated_text)) as total_size FROM translation_cache`)
    const size = sizeStmt.get() as { total_size: number }
    
    const oldestStmt = db.prepare(`SELECT MIN(created_at) as oldest FROM translation_cache`)
    const oldest = oldestStmt.get() as { oldest: number | null }
    
    const byEngineStmt = db.prepare(`
      SELECT engine, COUNT(*) as count, SUM(hits) as total_hits 
      FROM translation_cache 
      GROUP BY engine 
      ORDER BY count DESC
    `)
    const byEngine = byEngineStmt.all()
    
    return {
      total_entries: total.count,
      total_hits: hits.total_hits || 0,
      total_size_bytes: size.total_size || 0,
      total_size_mb: ((size.total_size || 0) / (1024 * 1024)).toFixed(2),
      oldest_entry: oldest.oldest ? new Date(oldest.oldest * 1000).toISOString() : null,
      by_engine: byEngine,
    }
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return {
      total_entries: 0,
      total_hits: 0,
      total_size_bytes: 0,
      total_size_mb: '0',
      oldest_entry: null,
      by_engine: [],
    }
  }
}

export function purgeOldCache(maxAgeDays: number = 30): number {
  try {
    const cutoff = Math.floor(Date.now() / 1000) - (maxAgeDays * 24 * 60 * 60)
    
    const stmt = db.prepare(`DELETE FROM translation_cache WHERE created_at < ?`)
    const result = stmt.run(cutoff)
    
    // Vacuum to reclaim space
    db.exec('VACUUM')
    
    return result.changes
  } catch (error) {
    console.error('Error purging cache:', error)
    return 0
  }
}

export function clearCache(): number {
  try {
    const stmt = db.prepare(`DELETE FROM translation_cache`)
    const result = stmt.run()
    
    // Vacuum to reclaim space
    db.exec('VACUUM')
    
    return result.changes
  } catch (error) {
    console.error('Error clearing cache:', error)
    return 0
  }
}