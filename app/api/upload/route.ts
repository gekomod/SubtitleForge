import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
export const maxDuration = 60; // czas wykonania w sekundach
export const maxBodySize = '100mb'; // limit rozmiaru body

// Ensure upload directory exists
async function ensureDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true })
  } catch (error) {
    console.error('Error creating upload directory:', error)
  }
}

// Funkcja do wykrywania języka - bardziej agresywna
function detectLanguage(text: string): string {
  if (!text || text.length < 10) return 'en'
  
  const samples = text.toLowerCase()
  
  // System punktowy dla każdego języka
  const scores: Record<string, number> = {
    pl: 0,
    en: 0,
    de: 0,
    fr: 0,
    es: 0,
    it: 0,
  }
  
  // Polskie znaki diakrytyczne - duża waga
  const plChars = (samples.match(/[ąćęłńóśźż]/g) || []).length
  scores.pl += plChars * 3
  
  // Polskie common words - bardzo specyficzne
  const plWords = ['się', 'jest', 'nie', 'tak', 'ale', 'co', 'to', 'na', 'z', 'do', 'jak', 'dla', 'przez', 'pod', 'nad', 'bez', 'oraz', 'tym', 'tego', 'może', 'bardzo', 'wszystko']
  plWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g')
    const count = (samples.match(regex) || []).length
    scores.pl += count * 2
  })
  
  // Angielskie common words
  const enWords = ['the', 'and', 'you', 'that', 'was', 'for', 'are', 'with', 'his', 'they', 'have', 'this', 'from', 'not', 'but', 'what', 'all', 'were', 'when', 'your', 'can', 'said', 'there']
  enWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g')
    const count = (samples.match(regex) || []).length
    scores.en += count
  })
  
  // Niemieckie znaki
  const deChars = (samples.match(/[äöüß]/g) || []).length
  scores.de += deChars * 3
  
  // Francuskie znaki
  const frChars = (samples.match(/[éèêëàâîïôûùçœæ]/g) || []).length
  scores.fr += frChars * 3
  
  // Hiszpańskie znaki
  const esChars = (samples.match(/[ñáéíóúü¿¡]/g) || []).length
  scores.es += esChars * 3
  
  // Włoskie znaki
  const itChars = (samples.match(/[àèéìíîòóùú]/g) || []).length
  scores.it += itChars * 3
  
  console.log('Language detection scores:', scores)
  
  // Znajdź język z najwyższym wynikiem
  let maxLang = 'en'
  let maxScore = 0
  
  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      maxLang = lang
    }
  }
  
  // Jeśli wynik jest bardzo niski, zwróć angielski
  if (maxScore < 2) return 'en'
  
  return maxLang
}

// Funkcja do liczenia bloków napisów SRT
function countSRTBlocks(content: string): number {
  const timestampPattern = /\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}/g
  const matches = content.match(timestampPattern)
  return matches ? matches.length : 0
}

// Funkcja do liczenia bloków ASS
function countASSBlocks(content: string): number {
  const matches = content.match(/^Dialogue:/gm)
  return matches ? matches.length : 0
}

// Funkcja do liczenia bloków VTT
function countVTTBlocks(content: string): number {
  const matches = content.match(/-->/g)
  return matches ? matches.length : 0
}

// Funkcja do ekstrakcji tekstu do wykrywania języka
function extractTextForDetection(content: string, filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  let text = ''
  
  if (ext === '.ass' || ext === '.ssa') {
    // ASS/SSA - wyciągnij tekst z linii Dialogue:
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.startsWith('Dialogue:')) {
        const parts = line.split(',')
        if (parts.length >= 10) {
          const dialogText = parts.slice(9).join(',').replace(/\{[^}]*\}/g, '').trim()
          if (dialogText) {
            text += ' ' + dialogText
          }
        }
      }
    }
  } else if (ext === '.vtt') {
    // VTT - weź linie po znacznikach czasu
    const lines = content.split('\n')
    let collectText = false
    for (const line of lines) {
      if (line.includes('-->')) {
        collectText = true
      } else if (collectText && line.trim() && !line.startsWith('WEBVTT') && !line.startsWith('NOTE')) {
        text += ' ' + line.trim()
        collectText = false
      }
    }
  } else {
    // SRT - bardziej zaawansowane parsowanie
    const lines = content.split('\n')
    let i = 0
    
    while (i < lines.length) {
      const line = lines[i].trim()
      
      // Szukamy timestampu
      if (line.includes('-->')) {
        i++ // przejdź do następnej linii (pierwsza linia tekstu)
        
        // Zbieraj wszystkie linie tekstu aż do pustej linii
        while (i < lines.length && lines[i].trim() !== '') {
          const textLine = lines[i].trim()
          // Ignoruj numery (jeśli pojawią się w środku)
          if (!/^\d+$/.test(textLine)) {
            text += ' ' + textLine
          }
          i++
        }
      }
      i++
    }
  }
  
  const result = text.trim()
  console.log('Extracted text for detection:', result.substring(0, 200) + '...')
  return result
}

export async function POST(request: NextRequest) {
  try {
    await ensureDir()
    
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Brak pliku' },
        { status: 400 }
      )
    }

    // Sprawdź dozwolone formaty
    const allowedExtensions = ['.srt', '.ass', '.ssa', '.vtt']
    const ext = path.extname(file.name).toLowerCase()
    
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { success: false, error: 'Niedozwolony format. Dozwolone: .srt, .ass, .ssa, .vtt' },
        { status: 400 }
      )
    }

    const fileId = uuidv4()
    // Zapisz plik z pełną nazwą: UUID_originalna_nazwa
    const savedFilename = `${fileId}_${file.name}`
    const filepath = path.join(UPLOAD_DIR, savedFilename)

    // Odczytaj zawartość pliku
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Odczytaj zawartość jako tekst
    const content = buffer.toString('utf-8')
    
    // Wyciągnij tekst do wykrywania języka
    const textForDetection = extractTextForDetection(content, file.name)
    const detectedLang = textForDetection ? detectLanguage(textForDetection) : 'en'
    
    // Policz bloki w zależności od formatu
    let blocksCount = 0
    if (ext === '.ass' || ext === '.ssa') {
      blocksCount = countASSBlocks(content)
    } else if (ext === '.vtt') {
      blocksCount = countVTTBlocks(content)
    } else {
      blocksCount = countSRTBlocks(content)
    }

    const fileType = ext === '.ass' || ext === '.ssa' ? 'ASS' : ext === '.vtt' ? 'VTT' : 'SRT'

    console.log('Upload result:', {
      fileId,
      savedFilename,
      filename: file.name,
      blocks: blocksCount,
      detectedLang,
      fileType
    })

    return NextResponse.json({
      success: true,
      file_id: fileId,
      saved_filename: savedFilename, // Dodajemy pełną nazwę pliku
      filename: file.name,
      file_type: fileType,
      size: buffer.length,
      blocks: blocksCount,
      detected_lang: detectedLang,
      library_hits: []
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    )
  }
}
