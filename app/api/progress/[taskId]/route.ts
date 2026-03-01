import { NextRequest, NextResponse } from 'next/server'

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params

  console.log('Progress request for task:', taskId)
  console.log('Task data:', translationProgress.get(taskId))

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: any) => {
        console.log('Sending progress:', data)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      if (!translationProgress.has(taskId)) {
        console.log('Task not found:', taskId)
        send({ error: 'Nie znaleziono zadania' })
        controller.close()
        return
      }

      const sendCurrentState = () => {
        const progress = translationProgress.get(taskId)
        if (progress) {
          send({
            progress: progress.progress || 0,
            current: progress.current || 0,
            total: progress.total || 0,
            status: progress.status || 'pending'
          })
        }
      }

      sendCurrentState()

      const interval = setInterval(() => {
        const progress = translationProgress.get(taskId)
        const queue = translationQueues.get(taskId) || []
        
        while (queue.length > 0) {
          const data = queue.shift()
          send(data)
          
          if (data.completed || data.error) {
            clearInterval(interval)
            controller.close()
            return
          }
        }
        
        if (progress) {
          send({
            progress: progress.progress || 0,
            current: progress.current || 0,
            total: progress.total || 0,
            status: progress.status || 'pending'
          })
        }
      }, 500)

      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}