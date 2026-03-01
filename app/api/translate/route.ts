import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { translateFile } from '@/lib/translators/worker'

// Globalne store
declare global {
  var translationProgress: Map<string, any>
  var translationQueues: Map<string, any[]>
}

if (!global.translationProgress) {
  global.translationProgress = new Map()
}
if (!global.translationQueues) {
  global.translationQueues = new Map()
}

const translationProgress = global.translationProgress
const translationQueues = global.translationQueues

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

    const taskId = uuidv4()
    const timestamp = Date.now()
    const originalExt = path.extname(saved_filename)
    const baseName = path.basename(saved_filename, originalExt)
    const outputFilename = `${baseName}.${target_lang}${originalExt}`
    
    console.log('Creating output file:', outputFilename)
    
    // Inicjalizuj queue dla tego zadania
    translationQueues.set(taskId, [])
    
    // Inicjalizuj progress
    translationProgress.set(taskId, {
      progress: 0,
      current: 0,
      total: 0,
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
      outputFilename
    })

    // Uruchom tłumaczenie w tle
    translateFile(
      saved_filename,
      outputFilename,
      { engine, source_lang, target_lang, ...config },
      (progress, current, total, liveData) => {
        // Aktualizuj progress w store
        translationProgress.set(taskId, {
          ...translationProgress.get(taskId),
          progress,
          current,
          total,
          status: progress < 100 ? 'translating' : 'completed'
        })
        
        // Dodaj do queue z danymi live jeśli są
        const queue = translationQueues.get(taskId) || []
        const message: any = { 
          progress, 
          current, 
          total,
          status: progress < 100 ? 'translating' : 'completed'
        }
        
        // Jeśli mamy dane live (przetłumaczony blok), dodaj je do wiadomości
        if (liveData) {
          message.block_id = liveData.block_id
          message.translated_text = liveData.translated_text
          message.original_preview = liveData.original_text_preview
          message.is_live_update = true
        }
        
        queue.push(message)
        translationQueues.set(taskId, queue)
        
        // Jeśli to ostatni blok, dodaj informację o zakończeniu
        if (progress >= 100) {
          console.log(`Translation completed for task: ${taskId}, file: ${outputFilename}`)
          
          const finalQueue = translationQueues.get(taskId) || []
          finalQueue.push({ 
            completed: true, 
            progress: 100,
            current,
            total,
            output_file: outputFilename
          })
          translationQueues.set(taskId, finalQueue)
        }
      }
    ).catch(error => {
      console.error('Translation error:', error)
      
      // Aktualizuj progress z błędem
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
      output_filename: outputFilename
    })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to start translation' },
      { status: 500 }
    )
  }
}