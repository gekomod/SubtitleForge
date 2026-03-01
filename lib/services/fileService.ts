import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { ALLOWED_EXTENSIONS } from '@/lib/config/constants'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
const TRANSLATED_DIR = process.env.TRANSLATED_DIR || path.join(process.cwd(), 'translated')

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    await fs.mkdir(TRANSLATED_DIR, { recursive: true })
  } catch (error) {
    console.error('Error creating directories:', error)
  }
}

ensureDirectories()

export interface UploadedFile {
  id: string
  originalName: string
  filename: string
  path: string
  size: number
  format: string
}

export function allowedFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ext ? ALLOWED_EXTENSIONS.includes(ext as any) : false
}

export async function saveUploadedFile(file: File): Promise<UploadedFile> {
  const fileId = uuidv4()
  const originalName = file.name
  const ext = path.extname(originalName)
  const filename = `${fileId}_${originalName}`
  const filepath = path.join(UPLOAD_DIR, filename)
  
  // Convert File to Buffer and save
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(filepath, buffer)
  
  const format = ext === '.ass' || ext === '.ssa' ? 'ass' : ext === '.vtt' ? 'vtt' : 'srt'
  
  return {
    id: fileId,
    originalName,
    filename,
    path: filepath,
    size: buffer.length,
    format,
  }
}

export async function getFileInfo(fileId: string): Promise<UploadedFile | null> {
  try {
    const files = await fs.readdir(UPLOAD_DIR)
    const filename = files.find(f => f.startsWith(fileId))
    
    if (!filename) return null
    
    const filepath = path.join(UPLOAD_DIR, filename)
    const stats = await fs.stat(filepath)
    const originalName = filename.substring(filename.indexOf('_') + 1)
    const ext = path.extname(originalName)
    const format = ext === '.ass' || ext === '.ssa' ? 'ass' : ext === '.vtt' ? 'vtt' : 'srt'
    
    return {
      id: fileId,
      originalName,
      filename,
      path: filepath,
      size: stats.size,
      format,
    }
  } catch (error) {
    console.error('Error getting file info:', error)
    return null
  }
}

export async function readFileContent(filepath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
  return fs.readFile(filepath, encoding)
}

export async function fileExists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath)
    return true
  } catch {
    return false
  }
}

export async function deleteFile(filepath: string): Promise<boolean> {
  try {
    await fs.unlink(filepath)
    return true
  } catch {
    return false
  }
}

export function getTranslatedPath(filename: string): string {
  return path.join(TRANSLATED_DIR, filename)
}

export async function cleanupOldFiles(maxAgeSeconds: number = 3600): Promise<number> {
  const now = Date.now()
  let deleted = 0
  
  try {
    const dirs = [UPLOAD_DIR, TRANSLATED_DIR]
    
    for (const dir of dirs) {
      const files = await fs.readdir(dir)
      
      for (const file of files) {
        const filepath = path.join(dir, file)
        const stats = await fs.stat(filepath)
        const age = (now - stats.mtimeMs) / 1000
        
        if (age > maxAgeSeconds) {
          await fs.unlink(filepath)
          deleted++
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up files:', error)
  }
  
  return deleted
}