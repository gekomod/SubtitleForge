import fs from 'fs/promises'
import path from 'path'

export async function cleanupFiles(
  uploadDir: string,
  translatedDir: string,
  maxAgeSeconds: number = 3600
): Promise<number> {
  const now = Date.now()
  let deleted = 0

  try {
    const dirs = [uploadDir, translatedDir]

    for (const dir of dirs) {
      try {
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
      } catch (error) {
        console.error(`Error cleaning up directory ${dir}:`, error)
      }
    }
  } catch (error) {
    console.error('Error during cleanup:', error)
  }

  return deleted
}

export function cleanupTasks(
  progressMap: Map<string, any>,
  queueMap: Map<string, any[]>,
  maxAgeSeconds: number = 7200
): number {
  const now = Date.now() / 1000
  let deleted = 0

  // Konwertuj Map na tablicę przed iteracją
  const entries = Array.from(progressMap.entries())
  
  for (const [taskId, progress] of entries) {
    if (progress.created_at && (now - progress.created_at / 1000) > maxAgeSeconds) {
      progressMap.delete(taskId)
      queueMap.delete(taskId)
      deleted++
    }
  }

  return deleted
}

export function startBackgroundCleanup(
  uploadDir: string,
  translatedDir: string,
  progressMap: Map<string, any>,
  queueMap: Map<string, any[]>,
  interval: number = 600,
  fileTTL: number = 3600,
  taskTTL: number = 7200
) {
  const runCleanup = async () => {
    try {
      await cleanupFiles(uploadDir, translatedDir, fileTTL)
      cleanupTasks(progressMap, queueMap, taskTTL)
    } catch (error) {
      console.error('Background cleanup error:', error)
    }
  }

  // Run immediately
  runCleanup()

  // Schedule recurring cleanup
  const intervalId = setInterval(runCleanup, interval * 1000)

  // Return cleanup function
  return () => clearInterval(intervalId)
}