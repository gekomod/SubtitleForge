import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { api_key } = await request.json()
    
    if (!api_key) {
      return NextResponse.json(
        { success: false, error: 'Brak klucza API' }
      )
    }

    // Użyj AbortController do timeoutu zamiast opcji timeout w fetch
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${api_key}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`)
      }

      const data = await response.json()
      
      const models = (data.data || []).map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
      }))

      const popularIds = new Set([
        'meta-llama/llama-3.2-3b-instruct:free',
        'meta-llama/llama-3.1-8b-instruct',
        'mistralai/mistral-7b-instruct',
        'openai/gpt-3.5-turbo',
        'anthropic/claude-3-haiku',
        'google/gemini-pro',
      ])

      const recommended = models.filter((m: any) => popularIds.has(m.id))
      const other = models.filter((m: any) => !popularIds.has(m.id)).slice(0, 30)

      return NextResponse.json({
        success: true,
        recommended,
        other,
      })
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('Request timeout after 10 seconds')
      }
      throw error
    }
  } catch (error: any) {
    console.error('Error fetching OpenRouter models:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}