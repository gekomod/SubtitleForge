import { NextRequest, NextResponse } from 'next/server'

declare global {
  var translationProgress: Map<string, any>
  var translationQueues: Map<string, any[]>
}

if (!global.translationProgress) global.translationProgress = new Map()
if (!global.translationQueues) global.translationQueues = new Map()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {}
      }

      if (!global.translationProgress.has(taskId)) {
        send({ error: 'Nie znaleziono zadania' })
        controller.close()
        return
      }

      // Send current state immediately
      const initial = global.translationProgress.get(taskId)
      if (initial) {
        send({
          progress: initial.progress || 0,
          current: initial.current || 0,
          total: initial.total || 0,
          status: initial.status || 'pending',
        })
      }

      let staleTicks = 0

      const interval = setInterval(() => {
        const queue = global.translationQueues.get(taskId) || []

        if (queue.length > 0) {
          staleTicks = 0
          // Drain entire queue
          while (queue.length > 0) {
            const data = queue.shift()!
            console.log('Sending progress:', data)
            send(data)
            if (data.completed || data.error) {
              clearInterval(interval)
              setTimeout(() => { try { controller.close() } catch {} }, 200)
              return
            }
          }
          global.translationQueues.set(taskId, queue)
        } else {
          // No new data — send heartbeat from store so client knows we're alive
          staleTicks++
          const prog = global.translationProgress.get(taskId)
          if (prog) {
            send({
              progress: prog.progress || 0,
              current: prog.current || 0,
              total: prog.total || 0,
              status: prog.status || 'pending',
            })
            // If error set in store but not propagated via queue
            if (prog.status === 'error' && prog.error) {
              send({ error: prog.error, status: 'error' })
              clearInterval(interval)
              setTimeout(() => { try { controller.close() } catch {} }, 200)
              return
            }
          }
          // Timeout after 10 minutes of no progress
          if (staleTicks > 1200) {
            send({ error: 'Timeout — tłumaczenie trwa za długo' })
            clearInterval(interval)
            try { controller.close() } catch {}
          }
        }
      }, 500)

      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        try { controller.close() } catch {}
      })
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
