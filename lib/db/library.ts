import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

const DB_PATH = path.join(process.cwd(), 'data', 'library.db')

let db: SqlJsDatabase | null = null
let initPromise: Promise<SqlJsDatabase> | null = null

// Inicjalizacja bazy danych
async function initDB(): Promise<SqlJsDatabase> {
  if (db) return db
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      // Załaduj SQL.js
      const SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      })
      
      let database: SqlJsDatabase
      
      try {
        // Spróbuj wczytać istniejącą bazę
        const data = await fs.readFile(DB_PATH)
        database = new SQL.Database(data)
        console.log('✓ Loaded existing database from:', DB_PATH)
      } catch {
        // Utwórz nową bazę
        database = new SQL.Database()
        console.log('✓ Created new database at:', DB_PATH)
        
        // Utwórz tabele
        database.run(`
          CREATE TABLE library (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT NOT NULL UNIQUE,
            orig_filename TEXT NOT NULL,
            norm_title TEXT NOT NULL,
            file_path TEXT NOT NULL,
            engine TEXT NOT NULL,
            source_lang TEXT NOT NULL,
            target_lang TEXT NOT NULL,
            blocks INTEGER DEFAULT 0,
            created_at INTEGER NOT NULL
          )
        `)
        
        database.run(`
          CREATE INDEX idx_library_norm_title ON library(norm_title);
          CREATE INDEX idx_library_target_lang ON library(target_lang);
          CREATE INDEX idx_library_created_at ON library(created_at);
        `)
        
        // Zapisz bazę
        const data = database.export()
        await fs.mkdir(path.dirname(DB_PATH), { recursive: true })
        await fs.writeFile(DB_PATH, Buffer.from(data))
      }
      
      db = database
      return database
    } catch (error) {
      console.error('Error initializing database:', error)
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
    await fs.writeFile(DB_PATH, Buffer.from(data))
    console.log('✓ Database saved to:', DB_PATH)
  } catch (error) {
    console.error('Error saving database:', error)
  }
}

export interface LibraryEntry {
  id: number
  uuid: string
  orig_filename: string
  norm_title: string
  file_path: string
  engine: string
  source_lang: string
  target_lang: string
  blocks: number
  created_at: number
}

export function normalizeTitle(filename: string): string {
  if (!filename) return ''
  
  let title = filename
    .replace(/\.(srt|ass|ssa|vtt)$/i, '')
    .replace(/[._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
  
  // Usuń kody językowe (np. .pl., .en.)
  title = title.replace(/\.(pl|en|de|fr|es|it|ru|uk|cs|sk)\b/g, '')
  
  return title
}

export async function saveToLibrary(
  origFilename: string,
  filePath: string,
  engine: string,
  sourceLang: string,
  targetLang: string,
  blocks: number = 0
): Promise<number | null> {
  try {
    const database = await initDB()
    const normTitle = normalizeTitle(origFilename)
    const id = uuidv4()
    const now = Math.floor(Date.now() / 1000)
    
    const stmt = database.prepare(`
      INSERT INTO library (uuid, orig_filename, norm_title, file_path, engine, source_lang, target_lang, blocks, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run([id, origFilename, normTitle, filePath, engine, sourceLang, targetLang, blocks, now])
    
    // Zapisz zmiany
    await saveDB()
    
    // Pobierz ostatnie ID
    const result = database.exec('SELECT last_insert_rowid() as id')
    const lastId = result[0]?.values[0][0]
    
    // Konwersja na number
    const numericId = lastId !== undefined ? Number(lastId) : null
    
    console.log('✓ Saved to library:', { id: numericId, normTitle, engine, targetLang })
    return numericId
  } catch (error) {
    console.error('Error saving to library:', error)
    return null
  }
}

export async function findExisting(filename: string, targetLang: string): Promise<LibraryEntry | null> {
  try {
    const database = await initDB()
    const normTitle = normalizeTitle(filename)
    
    const stmt = database.prepare(`
      SELECT * FROM library 
      WHERE norm_title = ? AND target_lang = ?
      ORDER BY created_at DESC LIMIT 1
    `)
    
    const result = stmt.getAsObject([normTitle, targetLang])
    
    if (result && result.id) {
      return {
        id: Number(result.id),
        uuid: String(result.uuid || ''),
        orig_filename: String(result.orig_filename || ''),
        norm_title: String(result.norm_title || ''),
        file_path: String(result.file_path || ''),
        engine: String(result.engine || ''),
        source_lang: String(result.source_lang || ''),
        target_lang: String(result.target_lang || ''),
        blocks: Number(result.blocks || 0),
        created_at: Number(result.created_at || 0),
      }
    }
    return null
  } catch (error) {
    console.error('Error finding existing:', error)
    return null
  }
}

export async function searchLibrary(query: string, lang: string = '', limit: number = 50): Promise<LibraryEntry[]> {
  try {
    const database = await initDB()
    const searchTerm = `%${query.toLowerCase()}%`
    
    let sql = `
      SELECT * FROM library 
      WHERE (norm_title LIKE ? OR orig_filename LIKE ?)
    `
    const params: any[] = [searchTerm, searchTerm]
    
    if (lang) {
      sql += ` AND target_lang = ?`
      params.push(lang)
    }
    
    sql += ` ORDER BY created_at DESC LIMIT ?`
    params.push(limit)
    
    const stmt = database.prepare(sql)
    const results = stmt.getAsObject(params)
    
    // Konwersja na tablicę
    const entries: LibraryEntry[] = []
    
    if (Array.isArray(results)) {
      results.forEach((row: any) => {
        if (row && row.id) {
          entries.push({
            id: Number(row.id),
            uuid: String(row.uuid || ''),
            orig_filename: String(row.orig_filename || ''),
            norm_title: String(row.norm_title || ''),
            file_path: String(row.file_path || ''),
            engine: String(row.engine || ''),
            source_lang: String(row.source_lang || ''),
            target_lang: String(row.target_lang || ''),
            blocks: Number(row.blocks || 0),
            created_at: Number(row.created_at || 0),
          })
        }
      })
    } else if (results && results.id) {
      entries.push({
        id: Number(results.id),
        uuid: String(results.uuid || ''),
        orig_filename: String(results.orig_filename || ''),
        norm_title: String(results.norm_title || ''),
        file_path: String(results.file_path || ''),
        engine: String(results.engine || ''),
        source_lang: String(results.source_lang || ''),
        target_lang: String(results.target_lang || ''),
        blocks: Number(results.blocks || 0),
        created_at: Number(results.created_at || 0),
      })
    }
    
    return entries
  } catch (error) {
    console.error('Error searching library:', error)
    return []
  }
}

export async function getRecent(limit: number = 20): Promise<LibraryEntry[]> {
  try {
    const database = await initDB()
    
    const stmt = database.prepare(`
      SELECT * FROM library 
      ORDER BY created_at DESC LIMIT ?
    `)
    
    const results = stmt.getAsObject([limit])
    const entries: LibraryEntry[] = []
    
    if (Array.isArray(results)) {
      results.forEach((row: any) => {
        if (row && row.id) {
          entries.push({
            id: Number(row.id),
            uuid: String(row.uuid || ''),
            orig_filename: String(row.orig_filename || ''),
            norm_title: String(row.norm_title || ''),
            file_path: String(row.file_path || ''),
            engine: String(row.engine || ''),
            source_lang: String(row.source_lang || ''),
            target_lang: String(row.target_lang || ''),
            blocks: Number(row.blocks || 0),
            created_at: Number(row.created_at || 0),
          })
        }
      })
    } else if (results && results.id) {
      entries.push({
        id: Number(results.id),
        uuid: String(results.uuid || ''),
        orig_filename: String(results.orig_filename || ''),
        norm_title: String(results.norm_title || ''),
        file_path: String(results.file_path || ''),
        engine: String(results.engine || ''),
        source_lang: String(results.source_lang || ''),
        target_lang: String(results.target_lang || ''),
        blocks: Number(results.blocks || 0),
        created_at: Number(results.created_at || 0),
      })
    }
    
    return entries
  } catch (error) {
    console.error('Error getting recent:', error)
    return []
  }
}

export async function getLibraryStats() {
  try {
    const database = await initDB()
    
    const totalStmt = database.prepare(`SELECT COUNT(*) as count FROM library`)
    const totalResult = totalStmt.getAsObject([])
    const total = Number(totalResult?.count || 0)
    
    const langsStmt = database.prepare(`
      SELECT target_lang, COUNT(*) as count 
      FROM library 
      GROUP BY target_lang 
      ORDER BY count DESC
    `)
    const langsResults = langsStmt.getAsObject([])
    
    const byLang = Array.isArray(langsResults) ? langsResults : (langsResults ? [langsResults] : [])
    
    const enginesStmt = database.prepare(`
      SELECT engine, COUNT(*) as count 
      FROM library 
      GROUP BY engine 
      ORDER BY count DESC
    `)
    const enginesResults = enginesStmt.getAsObject([])
    const byEngine = Array.isArray(enginesResults) ? enginesResults : (enginesResults ? [enginesResults] : [])
    
    return {
      total,
      byLang,
      byEngine,
    }
  } catch (error) {
    console.error('Error getting stats:', error)
    return { total: 0, byLang: [], byEngine: [] }
  }
}

export async function deleteEntry(id: number): Promise<boolean> {
  try {
    const database = await initDB()
    
    // Najpierw pobierz ścieżkę pliku
    const getStmt = database.prepare(`SELECT file_path FROM library WHERE id = ?`)
    const entry = getStmt.getAsObject([id])
    
    if (entry && entry.file_path) {
      try {
        await fs.unlink(String(entry.file_path))
        console.log('✓ Deleted file:', entry.file_path)
      } catch (err) {
        console.error('Error deleting file:', err)
      }
    }
    
    // Usuń z bazy
    const deleteStmt = database.prepare(`DELETE FROM library WHERE id = ?`)
    deleteStmt.run([id])
    
    // Zapisz zmiany
    await saveDB()
    
    console.log('✓ Deleted entry:', id)
    return true
  } catch (error) {
    console.error('Error deleting entry:', error)
    return false
  }
}

export async function getEntryById(id: number): Promise<LibraryEntry | null> {
  try {
    const database = await initDB()
    const stmt = database.prepare(`SELECT * FROM library WHERE id = ?`)
    const result = stmt.getAsObject([id])
    
    if (result && result.id) {
      return {
        id: Number(result.id),
        uuid: String(result.uuid || ''),
        orig_filename: String(result.orig_filename || ''),
        norm_title: String(result.norm_title || ''),
        file_path: String(result.file_path || ''),
        engine: String(result.engine || ''),
        source_lang: String(result.source_lang || ''),
        target_lang: String(result.target_lang || ''),
        blocks: Number(result.blocks || 0),
        created_at: Number(result.created_at || 0),
      }
    }
    return null
  } catch (error) {
    console.error('Error getting entry:', error)
    return null
  }
}

export async function cleanupOldEntries(maxAgeDays: number = 30): Promise<number> {
  try {
    const database = await initDB()
    const cutoff = Math.floor(Date.now() / 1000) - (maxAgeDays * 24 * 60 * 60)
    
    // Pobierz wpisy do usunięcia
    const selectStmt = database.prepare(`SELECT file_path FROM library WHERE created_at < ?`)
    const toDelete = selectStmt.getAsObject([cutoff])
    
    const entriesToDelete = Array.isArray(toDelete) ? toDelete : (toDelete ? [toDelete] : [])
    
    // Usuń pliki
    for (const entry of entriesToDelete) {
      if (entry && entry.file_path) {
        try {
          await fs.unlink(String(entry.file_path))
        } catch (err) {
          console.error('Error deleting file:', err)
        }
      }
    }
    
    // Usuń z bazy
    const deleteStmt = database.prepare(`DELETE FROM library WHERE created_at < ?`)
    deleteStmt.run([cutoff])
    
    // Zapisz zmiany
    await saveDB()
    
    const result = deleteStmt.getAsObject([])
    const count = Number(result?.changes || 0)
    console.log(`✓ Cleaned up ${count} old entries`)
    return count
  } catch (error) {
    console.error('Error cleaning up library:', error)
    return 0
  }
}