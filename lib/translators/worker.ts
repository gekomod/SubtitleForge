import { translate } from './engines'
import fs from 'fs/promises'
import path from 'path'
import { getCachedTranslation, saveToCache } from '@/lib/db/cache'
import { readSubtitleFile } from '@/lib/utils/encoding'
import fs2 from 'fs'
import path2 from 'path'

// Translation Memory — load once per process
let _tmEntries: Array<{find:string;replace:string;enabled:boolean}> | null = null
function loadTM() {
  if (_tmEntries !== null) return _tmEntries
  try {
    const p = path2.join(process.cwd(), 'data', 'translation_memory.json')
    _tmEntries = JSON.parse(fs2.readFileSync(p, 'utf-8')).filter((e:any) => e.enabled !== false)
  } catch { _tmEntries = [] }
  return _tmEntries!
}
function applyTM(text: string): string {
  let result = text
  for (const e of loadTM()) {
    if (!e.find) continue
    try {
      const rx = new RegExp(e.find.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'gi')
      result = result.replace(rx, e.replace)
    } catch {}
  }
  return result
}
// Invalidate TM cache on each translateFile call
function invalidateTM() { _tmEntries = null }

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
const TRANSLATED_DIR = path.join(process.cwd(), 'translated')

// Ensure directories exist
async function ensureDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    await fs.mkdir(TRANSLATED_DIR, { recursive: true })
  } catch (error) {
    console.error('Error creating directories:', error)
  }
}

// Funkcje do parsowania różnych formatów
function parseSRT(content: string): Array<{ id: number; text: string }> {
  if (!content) return []
  
  // CRITICAL: normalize CRLF (Windows) and CR (old Mac) line endings
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  
  const blocks: Array<{ id: number; text: string }> = []
  const lines = normalized.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]?.trim() || ''
    
    if (/^\d+$/.test(line) && i + 1 < lines.length && lines[i + 1]?.includes('-->')) {
      const id = parseInt(line, 10)
      i++ // przejdź do timestamp
      i++ // pomiń timestamp
      
      const textLines: string[] = []
      while (i < lines.length && lines[i]?.trim() !== '') {
        textLines.push(lines[i].trim())
        i++
      }
      
      if (textLines.length > 0) {
        blocks.push({
          id,
          text: textLines.join('\n')
        })
      }
    }
    i++
  }
  
  console.log(`Parsed ${blocks.length} SRT blocks`)
  return blocks
}

function parseASS(content: string): Array<{ id: number; text: string }> {
  if (!content) return []
  
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const blocks: Array<{ id: number; text: string }> = []
  const lines = normalized.split('\n')
  let id = 1

  for (const line of lines) {
    if (line?.startsWith('Dialogue:')) {
      const parts = line.split(',')
      if (parts.length >= 10) {
        // ASS has exactly 9 fixed fields before the text
        const text = parts.slice(9).join(',').replace(/\{[^}]*\}/g, '').trim()
        if (text) {
          blocks.push({ id: id++, text })
        }
      }
    }
  }
  
  console.log(`Parsed ${blocks.length} ASS blocks`)
  return blocks
}

function parseVTT(content: string): Array<{ id: number; text: string }> {
  if (!content) return []
  
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const blocks: Array<{ id: number; text: string }> = []
  const lines = normalized.split('\n')
  let id = 1
  let i = 0

  while (i < lines.length) {
    const line = lines[i]?.trim() || ''
    
    if (line.includes('-->')) {
      i++ // przejdź do tekstu
      
      const textLines: string[] = []
      while (i < lines.length && lines[i]?.trim() !== '' && !lines[i]?.includes('-->')) {
        textLines.push(lines[i].trim())
        i++
      }
      
      if (textLines.length > 0) {
        blocks.push({
          id: id++,
          text: textLines.join('\n')
        })
      }
    }
    i++
  }
  
  console.log(`Parsed ${blocks.length} VTT blocks`)
  return blocks
}

// Funkcje do generowania plików wyjściowych
function generateSRT(originalBlocks: Array<{ id: number; text: string }>, translatedBlocks: Array<{ id: number; text: string }>, originalContent: string): string {
  if (!originalContent) return ''
  
  // Normalize CRLF
  const content = originalContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = content.split('\n')
  const output: string[] = []
  
  // Stwórz mapę przetłumaczonych bloków
  const translatedMap = new Map<number, string>()
  translatedBlocks.forEach(block => {
    translatedMap.set(block.id, block.text)
    console.log(`Map block ${block.id} ->`, block.text.substring(0, 30))
  })
  
  let i = 0
  while (i < lines.length) {
    const line = lines[i] || ''
    
    // Szukamy bloku
    if (/^\d+$/.test(line.trim()) && i + 1 < lines.length && lines[i + 1]?.includes('-->')) {
      const id = parseInt(line.trim(), 10)
      
      // Zachowaj numer
      output.push(line)
      i++
      
      // Zachowaj timestamp
      output.push(lines[i] || '')
      i++
      
      // Sprawdź czy mamy tłumaczenie dla tego bloku
      const translatedText = translatedMap.get(id)
      if (translatedText) {
        console.log(`✓ Block ${id}: Using translated text`)
        output.push(translatedText)
      } else {
        console.log(`⚠ Block ${id}: No translation found, using original`)
        // Jeśli nie ma tłumaczenia, użyj oryginalnego tekstu
        const originalTextLines: string[] = []
        while (i < lines.length && lines[i]?.trim() !== '') {
          originalTextLines.push(lines[i] || '')
          i++
        }
        output.push(...originalTextLines)
      }
      
      // Pomiń resztę oryginalnego tekstu
      while (i < lines.length && lines[i]?.trim() !== '') {
        i++
      }
      
      // Zachowaj pustą linię po bloku
      if (i < lines.length) {
        output.push('')
      }
    } else {
      output.push(line)
      i++
    }
  }
  
  return output.join('\n')
}

function generateASS(originalBlocks: Array<{ id: number; text: string }>, translatedBlocks: Array<{ id: number; text: string }>, originalContent: string): string {
  if (!originalContent) return ''
  
  const content = originalContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = content.split('\n')
  
  const translatedMap = new Map<number, string>()
  translatedBlocks.forEach(block => {
    translatedMap.set(block.id, block.text)
  })
  
  const output: string[] = []
  let currentId = 1

  for (const line of lines) {
    if (line?.startsWith('Dialogue:')) {
      const parts = line.split(',', 10)
      if (parts.length >= 10) {
        const translatedText = translatedMap.get(currentId)
        if (translatedText) {
          console.log(`✓ ASS Block ${currentId}: Using translated text`)
          const translated = translatedText.replace(/\n/g, '\\N')
          parts[9] = translated
          output.push(parts.join(','))
        } else {
          console.log(`⚠ ASS Block ${currentId}: No translation found`)
          output.push(line)
        }
        currentId++
      } else {
        output.push(line)
      }
    } else {
      output.push(line)
    }
  }
  
  return output.join('\n')
}

function generateVTT(originalBlocks: Array<{ id: number; text: string }>, translatedBlocks: Array<{ id: number; text: string }>, originalContent: string): string {
  if (!originalContent) return ''
  
  const content = originalContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = content.split('\n')
  
  const translatedMap = new Map<number, string>()
  translatedBlocks.forEach(block => {
    translatedMap.set(block.id, block.text)
  })
  
  const output: string[] = []
  let currentId = 1
  let i = 0

  while (i < lines.length) {
    const line = lines[i] || ''
    
    if (line.includes('-->')) {
      output.push(line)
      i++
      
      const translatedText = translatedMap.get(currentId)
      if (translatedText) {
        console.log(`✓ VTT Block ${currentId}: Using translated text`)
        output.push(translatedText)
        currentId++
      }
      
      // Pomiń oryginalny tekst
      while (i < lines.length && lines[i]?.trim() !== '') {
        i++
      }
      
      // Zachowaj pustą linię
      if (i < lines.length) {
        output.push('')
      }
    } else {
      output.push(line)
      i++
    }
  }
  
  return output.join('\n')
}

export async function translateFile(
  inputFilename: string,
  outputFilename: string,
  config: any,
  onProgress: (progress: number, current: number, total: number, liveData?: any) => void,
  abortSignal?: { aborted: boolean }
): Promise<string> {
  await ensureDir()
  
  const inputPath = path.join(UPLOAD_DIR, inputFilename)
  const outputPath = path.join(TRANSLATED_DIR, outputFilename)
  
  console.log('='.repeat(60))
  console.log('TRANSLATION PROCESS STARTED')
  console.log('Input file:', inputPath)
  console.log('Output file:', outputPath)
  console.log('='.repeat(60))
  
  // Sprawdź czy plik istnieje
  try {
    await fs.access(inputPath)
    console.log('✓ Input file exists')
  } catch (error) {
    console.error('✗ File not found:', inputPath)
    throw new Error(`File not found: ${inputFilename}`)
  }
  
  // Read file with encoding detection
  console.log('Reading input file...')
  const rawBuffer = await fs.readFile(inputPath)
  if (!rawBuffer || rawBuffer.length === 0) {
    throw new Error('File is empty')
  }
  const { content, encoding } = readSubtitleFile(rawBuffer)
  console.log(`✓ File read: ${rawBuffer.length} bytes, encoding: ${encoding}`)
  
  const ext = path.extname(inputFilename).toLowerCase()
  console.log('File extension:', ext)
  
  // Parsuj bloki
  console.log('Parsing blocks...')
  let originalBlocks: Array<{ id: number; text: string }> = []
  if (ext === '.ass' || ext === '.ssa') {
    originalBlocks = parseASS(content)
  } else if (ext === '.vtt') {
    originalBlocks = parseVTT(content)
  } else {
    originalBlocks = parseSRT(content)
  }
  
  const totalBlocks = config.totalBlocks || originalBlocks.length
  console.log(`✓ Found ${originalBlocks.length} blocks to translate (total: ${totalBlocks})`)
  
  // Tłumacz bloki
  const translatedBlocks: Array<{ id: number; text: string }> = []
  
  for (let i = 0; i < originalBlocks.length; i++) {
    const block = originalBlocks[i]
    
    try {
      console.log(`\n[${i + 1}/${totalBlocks}] Translating block ${block.id}:`)
      console.log('  Original:', JSON.stringify(block.text.substring(0, 50)) + (block.text.length > 50 ? '...' : ''))
      
      // Check abort signal
      if (abortSignal?.aborted) {
        console.log('Translation aborted at block', i + 1)
        throw new Error('ABORTED')
      }

      // Reload TM fresh each file
      if (i === 0) invalidateTM()

      // Check cache first
      const cached = getCachedTranslation(block.text, config.source_lang, config.target_lang, config.engine)
      let translated: string
      if (cached) {
        translated = cached
        console.log('  [CACHE HIT]')
      } else {
        translated = await translate(
          block.text,
          config.engine,
          config.source_lang,
          config.target_lang,
          config
        )
        // Apply Translation Memory post-processing
        translated = applyTM(translated)
        // Cache the result
        saveToCache(block.text, config.source_lang, config.target_lang, config.engine, translated)
      }
      
      console.log('  Translated:', JSON.stringify(translated.substring(0, 50)) + (translated.length > 50 ? '...' : ''))
      
      translatedBlocks.push({
        id: block.id,
        text: translated
      })
      
      const progress = Math.round(((i + 1) / totalBlocks) * 100)
      
      onProgress(progress, i + 1, totalBlocks, {
        block_id: block.id,
        translated_text: translated,
        original_text_preview: block.text.substring(0, 50)
      })
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
    } catch (error) {
      console.error(`✗ Error translating block ${i + 1}:`, error)
      translatedBlocks.push({
        id: block.id,
        text: block.text
      })
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log(`✓ Translated ${translatedBlocks.length} blocks`)
  
  // Generuj plik wyjściowy
  console.log('Generating output file...')
  let output = ''
  if (ext === '.ass' || ext === '.ssa') {
    output = generateASS(originalBlocks, translatedBlocks, content)
  } else if (ext === '.vtt') {
    output = generateVTT(originalBlocks, translatedBlocks, content)
  } else {
    output = generateSRT(originalBlocks, translatedBlocks, content)
  }
  
  if (!output) {
    throw new Error('Failed to generate output file')
  }
  
  console.log(`✓ Output generated: ${output.length} bytes`)
  
  // Zapisz plik
  console.log('Writing to disk...')
  await fs.writeFile(outputPath, output, 'utf-8')
  console.log('✓ File written')
  
  // Sprawdź czy plik został zapisany
  try {
    await fs.access(outputPath)
    const stats = await fs.stat(outputPath)
    console.log(`✓ File verified: ${outputPath} (${stats.size} bytes)`)
  } catch (error) {
    console.error('✗ Error verifying file save:', error)
    throw new Error('Failed to save translated file')
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('TRANSLATION COMPLETE')
  console.log('='.repeat(60))
  
  return outputPath
}