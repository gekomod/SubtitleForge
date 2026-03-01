import { translate } from './engines'
import fs from 'fs/promises'
import path from 'path'

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
  const blocks: Array<{ id: number; text: string }> = []
  const lines = content.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()
    
    // Szukamy numeru bloku
    if (/^\d+$/.test(line) && i + 1 < lines.length && lines[i + 1].includes('-->')) {
      const id = parseInt(line, 10)
      i++ // przejdź do timestamp
      
      // Timestamp
      i++ // pomiń timestamp
      
      // Zbierz tekst bloku (może być wiele linii)
      const textLines: string[] = []
      while (i < lines.length && lines[i].trim() !== '') {
        textLines.push(lines[i])
        i++
      }
      
      blocks.push({
        id,
        text: textLines.join('\n')
      })
    }
    i++
  }
  
  console.log(`Parsed ${blocks.length} SRT blocks`)
  return blocks
}

function parseASS(content: string): Array<{ id: number; text: string }> {
  const blocks: Array<{ id: number; text: string }> = []
  const lines = content.split('\n')
  let id = 1

  for (const line of lines) {
    if (line.startsWith('Dialogue:')) {
      const parts = line.split(',', 10)
      if (parts.length >= 10) {
        const text = parts.slice(9).join(',').trim()
        blocks.push({
          id: id++,
          text
        })
      }
    }
  }
  
  console.log(`Parsed ${blocks.length} ASS blocks`)
  return blocks
}

function parseVTT(content: string): Array<{ id: number; text: string }> {
  const blocks: Array<{ id: number; text: string }> = []
  const lines = content.split('\n')
  let id = 1
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()
    
    if (line.includes('-->')) {
      i++ // przejdź do tekstu
      
      const textLines: string[] = []
      while (i < lines.length && lines[i].trim() !== '' && !lines[i].includes('-->')) {
        textLines.push(lines[i])
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
  const lines = originalContent.split('\n')
  const output: string[] = []
  
  // Stwórz mapę przetłumaczonych bloków dla szybkiego dostępu
  const translatedMap = new Map<number, string>()
  translatedBlocks.forEach(block => {
    translatedMap.set(block.id, block.text)
    console.log(`Map block ${block.id} ->`, block.text.substring(0, 30))
  })
  
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    
    // Szukamy bloku
    if (/^\d+$/.test(line.trim()) && i + 1 < lines.length && lines[i + 1].includes('-->')) {
      const id = parseInt(line.trim(), 10)
      
      // Zachowaj numer
      output.push(line)
      i++
      
      // Zachowaj timestamp
      output.push(lines[i])
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
        while (i < lines.length && lines[i].trim() !== '') {
          originalTextLines.push(lines[i])
          i++
        }
        output.push(...originalTextLines)
      }
      
      // Pomiń resztę oryginalnego tekstu (jeśli nie został użyty)
      while (i < lines.length && lines[i].trim() !== '') {
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
  const lines = originalContent.split('\n')
  
  // Stwórz mapę przetłumaczonych bloków
  const translatedMap = new Map<number, string>()
  translatedBlocks.forEach(block => {
    translatedMap.set(block.id, block.text)
  })
  
  const output: string[] = []
  let currentId = 1

  for (const line of lines) {
    if (line.startsWith('Dialogue:')) {
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
  const lines = originalContent.split('\n')
  
  // Stwórz mapę przetłumaczonych bloków
  const translatedMap = new Map<number, string>()
  translatedBlocks.forEach(block => {
    translatedMap.set(block.id, block.text)
  })
  
  const output: string[] = []
  let currentId = 1
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    
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
      while (i < lines.length && lines[i].trim() !== '') {
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
  onProgress: (progress: number, current: number, total: number, liveData?: any) => void
): Promise<string> {
  await ensureDir()
  
  // Pełna ścieżka do pliku wejściowego
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
  
  // Wczytaj plik
  console.log('Reading input file...')
  const content = await fs.readFile(inputPath, 'utf-8')
  console.log(`✓ File read: ${content.length} bytes`)
  
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
  
  console.log(`✓ Found ${originalBlocks.length} blocks to translate`)
  
  // Tłumacz bloki
  const translatedBlocks: Array<{ id: number; text: string }> = []
  
  for (let i = 0; i < originalBlocks.length; i++) {
    const block = originalBlocks[i]
    
    try {
      console.log(`\n[${i + 1}/${originalBlocks.length}] Translating block ${block.id}:`)
      console.log('  Original:', JSON.stringify(block.text.substring(0, 50)) + (block.text.length > 50 ? '...' : ''))
      
      // Tłumacz
      const translated = await translate(
        block.text,
        config.engine,
        config.source_lang,
        config.target_lang,
        config
      )
      
      console.log('  Translated:', JSON.stringify(translated.substring(0, 50)) + (translated.length > 50 ? '...' : ''))
      
      translatedBlocks.push({
        id: block.id,
        text: translated
      })
      
      // Oblicz progress
      const progress = Math.round(((i + 1) / originalBlocks.length) * 100)
      
      // Wyślij progress z danymi na żywo
      onProgress(progress, i + 1, originalBlocks.length, {
        block_id: block.id,
        translated_text: translated,
        original_text_preview: block.text.substring(0, 50)
      })
      
      // Małe opóźnienie
      await new Promise(resolve => setTimeout(resolve, 50))
      
    } catch (error) {
      console.error(`✗ Error translating block ${i + 1}:`, error)
      // W przypadku błędu, użyj oryginalnego tekstu
      translatedBlocks.push({
        id: block.id,
        text: block.text
      })
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log(`✓ Translated ${translatedBlocks.length} blocks`)
  
  // Sprawdź czy wszystkie bloki mają tłumaczenia
  const missingTranslations = originalBlocks.filter(
    orig => !translatedBlocks.some(trans => trans.id === orig.id)
  )
  if (missingTranslations.length > 0) {
    console.log(`⚠ Missing translations for blocks:`, missingTranslations.map(b => b.id))
  }
  
  // Generuj plik wyjściowy
  console.log('\nGenerating output file...')
  let output = ''
  if (ext === '.ass' || ext === '.ssa') {
    output = generateASS(originalBlocks, translatedBlocks, content)
  } else if (ext === '.vtt') {
    output = generateVTT(originalBlocks, translatedBlocks, content)
  } else {
    output = generateSRT(originalBlocks, translatedBlocks, content)
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
    
    // Wyświetl pierwsze kilka linii dla weryfikacji
    const savedContent = await fs.readFile(outputPath, 'utf-8')
    const previewLines = savedContent.split('\n').slice(0, 30)
    
    console.log('\n' + '='.repeat(60))
    console.log('SAVED FILE PREVIEW (first 30 lines):')
    console.log('='.repeat(60))
    previewLines.forEach((line, idx) => {
      console.log(`${idx + 1}: ${line}`)
    })
    console.log('='.repeat(60))
    
    // Sprawdź czy są jakieś tłumaczenia
    let translationFound = false
    for (let i = 900; i <= 914; i++) {
      const translated = translatedBlocks.find(b => b.id === i)
      if (translated && savedContent.includes(translated.text.substring(0, 30))) {
        console.log(`✓ Found translation for block ${i} in saved file`)
        translationFound = true
      }
    }
    
    if (!translationFound) {
      console.log('⚠ WARNING: No translations found in saved file!')
      console.log('Translated blocks sample:', translatedBlocks.slice(0, 5).map(b => ({ id: b.id, text: b.text.substring(0, 30) })))
    }
    
  } catch (error) {
    console.error('✗ Error verifying file save:', error)
    throw new Error('Failed to save translated file')
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('TRANSLATION COMPLETE')
  console.log('='.repeat(60))
  
  return outputPath
}