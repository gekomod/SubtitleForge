import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { translateFile } from '@/lib/translators/worker'
import fs from 'fs/promises'
import { countBlocks } from '@/lib/utils/subtitleParser'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

// Globalne store
declare global {
  var translationProgress: Map<string, any>
  var translationQueues: Map<string, any[]>
  var translationAbortSignals: Map<string, { aborted: boolean }>
}

if (!global.translationProgress) {
  global.translationProgress = new Map()
}
if (!global.translationQueues) {
  global.translationQueues = new Map()
}
if (!global.translationAbortSignals) {
  global.translationAbortSignals = new Map<string, { aborted: boolean }>()
}

const translationProgress = global.translationProgress
const translationQueues = global.translationQueues
const translationAbortSignals = global.translationAbortSignals

// Funkcja do liczenia bloków z pliku
async function getTotalBlocks(filepath: string, filename: string): Promise<number> {
  try {
    const content = await fs.readFile(filepath, 'utf-8')
    const ext = path.extname(filename).toLowerCase()
    
    if (ext === '.ass' || ext === '.ssa') {
      return (content.match(/^Dialogue:/gm) || []).length
    } else if (ext === '.vtt') {
      return (content.match(/-->/g) || []).length
    } else {
      const timestampPattern = /\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}/g
      return (content.match(timestampPattern) || []).length
    }
  } catch (error) {
    console.error('Error counting blocks:', error)
    return 0
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { source_lang, target_lang, engine, file_id, saved_filename, ...config } = body

    if (!file_id || !saved_filename) {
      return NextResponse.json(
        { success: false, error: 'Brak informacji o pliku' },
        { status: 400 }
      )
    }

    // Znajdź plik i policz bloki
    const files = await fs.readdir(UPLOAD_DIR)
    const filename = files.find(f => f.startsWith(file_id))
    
    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Plik nie istnieje' },
        { status: 404 }
      )
    }

    const filepath = path.join(UPLOAD_DIR, filename)
    const totalBlocks = await getTotalBlocks(filepath, filename)
    
    console.log(`Total blocks for file ${filename}: ${totalBlocks}`)

    const taskId = uuidv4()
    const timestamp = Date.now()
    const originalExt = path.extname(saved_filename)
    const baseName = path.basename(saved_filename, originalExt)
    const outputFilename = `${baseName}.${target_lang}${originalExt}`
    
    console.log('Creating output file:', outputFilename)
    
    // Inicjalizuj queue dla tego zadania
    translationQueues.set(taskId, [])
    
    // Inicjalizuj progress z prawidłowym total
    translationProgress.set(taskId, {
      progress: 0,
      current: 0,
      total: totalBlocks, // Ustawiamy prawidłową liczbę bloków
      status: 'pending',
      file_type: path.extname(saved_filename).substring(1),
      created_at: Date.now(),
      output_file: outputFilename
    })

    console.log('Translation started:', { 
      taskId, 
      engine, 
      source_lang, 
      target_lang,
      saved_filename,
      outputFilename,
      totalBlocks
    })

    // Wyślij początkowy stan do queue
    const queue = translationQueues.get(taskId) || []
    queue.push({ 
      progress: 0, 
      current: 0, 
      total: totalBlocks,
      status: 'pending'
    })
    translationQueues.set(taskId, queue)

    console.log(`Starting translateFile: uploads/${filename} → translated/${outputFilename} (${totalBlocks} blocks, engine: ${engine})`)

    // Create abort signal for this task
    const abortSignal = { aborted: false }
    translationAbortSignals.set(taskId, abortSignal)

    // Uruchom tłumaczenie w tle
    translateFile(
      filename,
      outputFilename,
      { engine, source_lang, target_lang, totalBlocks, ...config },
      (progress, current, total, liveData) => {
        if (abortSignal.aborted) return  // skip progress updates after abort
        // Aktualizuj progress w store
        translationProgress.set(taskId, {
          ...translationProgress.get(taskId),
          progress,
          current,
          total: total || totalBlocks, // Użyj przekazanego total lub zachowaj oryginalne
          status: progress < 100 ? 'translating' : 'completed'
        })
        
        // Dodaj do queue z danymi live jeśli są
        const queue = translationQueues.get(taskId) || []
        const message: any = { 
          progress, 
          current, 
          total: total || totalBlocks,
          status: progress < 100 ? 'translating' : 'completed'
        }
        
        if (liveData) {
          message.block_id = liveData.block_id
          message.translated_text = liveData.translated_text
          message.original_preview = liveData.original_text_preview
          message.is_live_update = true
        }
        
        queue.push(message)
        translationQueues.set(taskId, queue)
        
        if (progress >= 100) {
          console.log(`Translation completed for task: ${taskId}, file: ${outputFilename}`)
          
          const finalQueue = translationQueues.get(taskId) || []
          finalQueue.push({ 
            completed: true, 
            progress: 100,
            current,
            total: total || totalBlocks,
            output_file: outputFilename
          })
          translationQueues.set(taskId, finalQueue)
        }
      },
      abortSignal
    ).catch(error => {
      translationAbortSignals.delete(taskId)
      if (error.message === 'ABORTED') {
        const queue = translationQueues.get(taskId) || []
        queue.push({ error: 'Tłumaczenie anulowane', status: 'error' })
        translationQueues.set(taskId, queue)
        return
      }
      console.error('Translation error:', error)
      
      translationProgress.set(taskId, {
        ...translationProgress.get(taskId),
        status: 'error',
        error: error.message
      })
      
      const queue = translationQueues.get(taskId) || []
      queue.push({ 
        error: error.message,
        status: 'error'
      })
      translationQueues.set(taskId, queue)
    })

    return NextResponse.json({
      success: true,
      task_id: taskId,
      output_filename: outputFilename,
      total_blocks: totalBlocks // Zwróć totalBlocks do klienta
    })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to start translation' },
      { status: 500 }
    )
  }
}

// DELETE /api/translate — abort a running translation
export async function DELETE(request: NextRequest) {
  try {
    const { task_id } = await request.json()
    if (!task_id) return NextResponse.json({ success: false, error: 'Brak task_id' })
    
    const signal = translationAbortSignals.get(task_id)
    if (signal) {
      signal.aborted = true
      translationAbortSignals.delete(task_id)
      console.log('Aborted task:', task_id)
      return NextResponse.json({ success: true, message: 'Tłumaczenie anulowane' })
    }
    return NextResponse.json({ success: false, error: 'Task not found or already finished' })
  } catch {
    return NextResponse.json({ success: false, error: 'Abort failed' }, { status: 500 })
  }
}
