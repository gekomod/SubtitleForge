import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

const DB_PATH = path.join(process.cwd(), 'data', 'library.db')

// Inicjalizacja bazy danych
let db: Database.Database | null = null

function initDB(): Database.Database {
  if (db) return db
  
  // Ensure directory exists
  const dbDir = path.dirname(DB_PATH)
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }
  
  // Otwórz połączenie z bazą
  db = new Database(DB_PATH)
  
  // Utwórz tabele jeśli nie istnieją
  db.exec(`
    CREATE TABLE IF NOT EXISTS library (
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
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_library_norm_title ON library(norm_title);
    CREATE INDEX IF NOT EXISTS idx_library_target_lang ON library(target_lang);
    CREATE INDEX IF NOT EXISTS idx_library_created_at ON library(created_at);
  `)
  
  console.log('✓ Database initialized at:', DB_PATH)
  return db
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
  
  title = title.replace(/\.(pl|en|de|fr|es|it|ru|uk|cs|sk)\b/g, '')
  
  return title
}

export function saveToLibrary(
  origFilename: string,
  filePath: string,
  engine: string,
  sourceLang: string,
  targetLang: string,
  blocks: number = 0
): number | null {
  try {
    const database = initDB()
    const normTitle = normalizeTitle(origFilename)
    const id = uuidv4()
    const now = Math.floor(Date.now() / 1000)
    
    const stmt = database.prepare(`
      INSERT INTO library (uuid, orig_filename, norm_title, file_path, engine, source_lang, target_lang, blocks, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const info = stmt.run(id, origFilename, normTitle, filePath, engine, sourceLang, targetLang, blocks, now)
    
    console.log('✓ Saved to library:', { id: info.lastInsertRowid, normTitle, engine, targetLang })
    return Number(info.lastInsertRowid)
  } catch (error) {
    console.error('Error saving to library:', error)
    return null
  }
}

export function findExisting(filename: string, targetLang: string): LibraryEntry | null {
  try {
    const database = initDB()
    const normTitle = normalizeTitle(filename)
    
    const stmt = database.prepare(`
      SELECT * FROM library 
      WHERE norm_title = ? AND target_lang = ?
      ORDER BY created_at DESC LIMIT 1
    `)
    
    const row = stmt.get(normTitle, targetLang) as any
    
    if (row) {
      return {
        id: row.id,
        uuid: row.uuid,
        orig_filename: row.orig_filename,
        norm_title: row.norm_title,
        file_path: row.file_path,
        engine: row.engine,
        source_lang: row.source_lang,
        target_lang: row.target_lang,
        blocks: row.blocks,
        created_at: row.created_at,
      }
    }
    return null
  } catch (error) {
    console.error('Error finding existing:', error)
    return null
  }
}

export function searchLibrary(query: string, lang: string = '', limit: number = 50): LibraryEntry[] {
  try {
    const database = initDB()
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
    const rows = stmt.all(...params) as any[]
    
    return rows.map(row => ({
      id: row.id,
      uuid: row.uuid,
      orig_filename: row.orig_filename,
      norm_title: row.norm_title,
      file_path: row.file_path,
      engine: row.engine,
      source_lang: row.source_lang,
      target_lang: row.target_lang,
      blocks: row.blocks,
      created_at: row.created_at,
    }))
  } catch (error) {
    console.error('Error searching library:', error)
    return []
  }
}

export function getRecent(limit: number = 20): LibraryEntry[] {
  try {
    const database = initDB()
    
    const stmt = database.prepare(`
      SELECT * FROM library 
      ORDER BY created_at DESC LIMIT ?
    `)
    
    const rows = stmt.all(limit) as any[]
    
    return rows.map(row => ({
      id: row.id,
      uuid: row.uuid,
      orig_filename: row.orig_filename,
      norm_title: row.norm_title,
      file_path: row.file_path,
      engine: row.engine,
      source_lang: row.source_lang,
      target_lang: row.target_lang,
      blocks: row.blocks,
      created_at: row.created_at,
    }))
  } catch (error) {
    console.error('Error getting recent:', error)
    return []
  }
}

export function getLibraryStats() {
  try {
    const database = initDB()
    
    const total = database.prepare('SELECT COUNT(*) as count FROM library').get() as { count: number }
    
    const byLang = database.prepare(`
      SELECT target_lang, COUNT(*) as count 
      FROM library 
      GROUP BY target_lang 
      ORDER BY count DESC
    `).all()
    
    const byEngine = database.prepare(`
      SELECT engine, COUNT(*) as count 
      FROM library 
      GROUP BY engine 
      ORDER BY count DESC
    `).all()
    
    return {
      total: total.count,
      byLang,
      byEngine,
    }
  } catch (error) {
    console.error('Error getting stats:', error)
    return { total: 0, byLang: [], byEngine: [] }
  }
}

export function deleteEntry(id: number): boolean {
  try {
    const database = initDB()
    
    const stmt = database.prepare('DELETE FROM library WHERE id = ?')
    const info = stmt.run(id)
    
    console.log('✓ Deleted entry:', id)
    return info.changes > 0
  } catch (error) {
    console.error('Error deleting entry:', error)
    return false
  }
}

export function getEntryById(id: number): LibraryEntry | null {
  try {
    const database = initDB()
    
    const stmt = database.prepare('SELECT * FROM library WHERE id = ?')
    const row = stmt.get(id) as any
    
    if (row) {
      return {
        id: row.id,
        uuid: row.uuid,
        orig_filename: row.orig_filename,
        norm_title: row.norm_title,
        file_path: row.file_path,
        engine: row.engine,
        source_lang: row.source_lang,
        target_lang: row.target_lang,
        blocks: row.blocks,
        created_at: row.created_at,
      }
    }
    return null
  } catch (error) {
    console.error('Error getting entry:', error)
    return null
  }
}

export function cleanupOldEntries(maxAgeDays: number = 30): number {
  try {
    const database = initDB()
    const cutoff = Math.floor(Date.now() / 1000) - (maxAgeDays * 24 * 60 * 60)
    
    const stmt = database.prepare('DELETE FROM library WHERE created_at < ?')
    const info = stmt.run(cutoff)
    
    console.log(`✓ Cleaned up ${info.changes} old entries`)
    return info.changes
  } catch (error) {
    console.error('Error cleaning up library:', error)
    return 0
  }
}