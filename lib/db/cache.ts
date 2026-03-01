import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import path from 'path'
import fs from 'fs/promises'

const CACHE_DB_PATH = process.env.CACHE_DB_PATH || path.join(process.cwd(), 'data', 'cache.db')

let db: SqlJsDatabase | null = null
let initPromise: Promise<SqlJsDatabase> | null = null

// Inicjalizacja bazy danych
async function initDB(): Promise<SqlJsDatabase> {
  if (db) return db
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(CACHE_DB_PATH), { recursive: true })
      
      // Załaduj SQL.js
      const SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      })
      
      let database: SqlJsDatabase
      
      try {
        // Spróbuj wczytać istniejącą bazę
        const data = await fs.readFile(CACHE_DB_PATH)
        database = new SQL.Database(data)
        console.log('✓ Loaded existing cache database')
      } catch {
        // Utwórz nową bazę
        database = new SQL.Database()
        console.log('✓ Created new cache database')
        
        // Utwórz tabele
        database.run(`
          CREATE TABLE translation_cache (
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
        
        database.run(`
          CREATE INDEX idx_cache_lookup ON translation_cache(source_text, source_lang, target_lang, engine);
          CREATE INDEX idx_cache_created_at ON translation_cache(created_at);
        `)
        
        // Zapisz bazę
        const data = database.export()
        await fs.writeFile(CACHE_DB_PATH, Buffer.from(data))
      }
      
      db = database
      return database
    } catch (error) {
      console.error('Error initializing cache database:', error)
      throw error
    }
  })()

  return initPromise
}

// Zapisz bazę do pliku
async function saveDB() {
  if (!db) return
  try {
    const data = db.export()
    await fs.writeFile(CACHE_DB_PATH, Buffer.from(data))
  } catch (error) {
    console.error('Error saving cache database:', error)
  }
}

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

export async function getCachedTranslation(
  sourceText: string,
  sourceLang: string,
  targetLang: string,
  engine: string,
  engineConfig: any = null
): Promise<string | null> {
  try {
    const database = await initDB()
    const configStr = engineConfig ? JSON.stringify(engineConfig) : null
    
    const stmt = database.prepare(`
      SELECT translated_text, hits FROM translation_cache
      WHERE source_text = ? AND source_lang = ? AND target_lang = ? AND engine = ? 
        AND (engine_config IS ? OR engine_config = ?)
      LIMIT 1
    `)
    
    const result = stmt.getAsObject([sourceText, sourceLang, targetLang, engine, configStr, configStr])
    
    if (result && result.translated_text) {
      // Update hit count
      const updateStmt = database.prepare(`
        UPDATE translation_cache SET hits = hits + 1
        WHERE source_text = ? AND source_lang = ? AND target_lang = ? AND engine = ?
      `)
      updateStmt.run([sourceText, sourceLang, targetLang, engine])
      
      await saveDB()
      return result.translated_text as string
    }
    
    return null
  } catch (error) {
    console.error('Error getting cached translation:', error)
    return null
  }
}

export async function saveToCache(
  sourceText: string,
  sourceLang: string,
  targetLang: string,
  engine: string,
  translatedText: string,
  engineConfig: any = null
): Promise<boolean> {
  try {
    const database = await initDB()
    const configStr = engineConfig ? JSON.stringify(engineConfig) : null
    const now = Math.floor(Date.now() / 1000)
    
    // Sprawdź czy istnieje
    const checkStmt = database.prepare(`
      SELECT hits FROM translation_cache
      WHERE source_text = ? AND source_lang = ? AND target_lang = ? AND engine = ? 
        AND (engine_config IS ? OR engine_config = ?)
    `)
    const existing = checkStmt.getAsObject([sourceText, sourceLang, targetLang, engine, configStr, configStr])
    
    if (existing && existing.hits) {
      // Update existing
      const updateStmt = database.prepare(`
        UPDATE translation_cache 
        SET translated_text = ?, hits = hits + 1, created_at = ?
        WHERE source_text = ? AND source_lang = ? AND target_lang = ? AND engine = ? 
          AND (engine_config IS ? OR engine_config = ?)
      `)
      updateStmt.run([translatedText, now, sourceText, sourceLang, targetLang, engine, configStr, configStr])
    } else {
      // Insert new
      const insertStmt = database.prepare(`
        INSERT INTO translation_cache 
        (source_text, source_lang, target_lang, engine, engine_config, translated_text, created_at, hits)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `)
      insertStmt.run([sourceText, sourceLang, targetLang, engine, configStr, translatedText, now])
    }
    
    await saveDB()
    return true
  } catch (error) {
    console.error('Error saving to cache:', error)
    return false
  }
}

export async function getCacheStats() {
  try {
    const database = await initDB()
    
    const totalStmt = database.prepare(`SELECT COUNT(*) as count FROM translation_cache`)
    const totalResult = totalStmt.getAsObject([])
    const total = (totalResult?.count as number) || 0
    
    const hitsStmt = database.prepare(`SELECT SUM(hits) as total_hits FROM translation_cache`)
    const hitsResult = hitsStmt.getAsObject([])
    const totalHits = (hitsResult?.total_hits as number) || 0
    
    const sizeStmt = database.prepare(`SELECT SUM(LENGTH(source_text) + LENGTH(translated_text)) as total_size FROM translation_cache`)
    const sizeResult = sizeStmt.getAsObject([])
    const totalSize = (sizeResult?.total_size as number) || 0
    
    const oldestStmt = database.prepare(`SELECT MIN(created_at) as oldest FROM translation_cache`)
    const oldestResult = oldestStmt.getAsObject([])
    
    const byEngineStmt = database.prepare(`
      SELECT engine, COUNT(*) as count, SUM(hits) as total_hits 
      FROM translation_cache 
      GROUP BY engine 
      ORDER BY count DESC
    `)
    const byEngineResults = byEngineStmt.getAsObject([])
    const byEngine = Array.isArray(byEngineResults) ? byEngineResults : (byEngineResults ? [byEngineResults] : [])
    
    return {
      total_entries: total,
      total_hits: totalHits,
      total_size_bytes: totalSize,
      total_size_mb: ((totalSize as number) / (1024 * 1024)).toFixed(2),
      oldest_entry: oldestResult?.oldest ? new Date((oldestResult.oldest as number) * 1000).toISOString() : null,
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

export async function purgeOldCache(maxAgeDays: number = 30): Promise<number> {
  try {
    const database = await initDB()
    const cutoff = Math.floor(Date.now() / 1000) - (maxAgeDays * 24 * 60 * 60)
    
    const deleteStmt = database.prepare(`DELETE FROM translation_cache WHERE created_at < ?`)
    deleteStmt.run([cutoff])
    
    await saveDB()
    
    // Pobierz liczbę usuniętych
    const result = deleteStmt.getAsObject([])
    const changes = (result?.changes as number) || 0
    console.log(`✓ Purged ${changes} old cache entries`)
    
    return changes
  } catch (error) {
    console.error('Error purging cache:', error)
    return 0
  }
}

export async function clearCache(): Promise<number> {
  try {
    const database = await initDB()
    
    const deleteStmt = database.prepare(`DELETE FROM translation_cache`)
    deleteStmt.run([])
    
    await saveDB()
    
    const result = deleteStmt.getAsObject([])
    const changes = (result?.changes as number) || 0
    console.log(`✓ Cleared ${changes} cache entries`)
    
    return changes
  } catch (error) {
    console.error('Error clearing cache:', error)
    return 0
  }
}