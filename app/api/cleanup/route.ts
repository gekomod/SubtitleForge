import { NextRequest, NextResponse } from 'next/server'
import { cleanupOldFiles } from '@/lib/services/fileService'

// In-memory stores (should be shared)
const translationProgress = new Map()
const translationQueues = new Map()

export async function POST(request: NextRequest) {
  try {
    const { max_age = 3600 } = await request.json()
    
    // Cleanup files
    const deletedFiles = await cleanupOldFiles(max_age)
    
    // Cleanup old tasks
    const now = Date.now() / 1000
    let deletedTasks = 0
    
    // Konwersja Map na tablicę wpisów przed iteracją
    const entries = Array.from(translationProgress.entries())
    
    for (const [taskId, progress] of entries) {
      if (progress.created_at && (now - progress.created_at / 1000) > max_age) {
        translationProgress.delete(taskId)
        translationQueues.delete(taskId)
        deletedTasks++
      }
    }
    
    return NextResponse.json({
      success: true,
      deleted_files: deletedFiles,
      deleted_tasks: deletedTasks,
    })
  } catch (error) {
    console.error('Error during cleanup:', error)
    return NextResponse.json(
      { success: false, error: 'Cleanup failed' },
      { status: 500 }
    )
  }
}