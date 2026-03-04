import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { engine, server, api_key, model, token, auth_key } = data

    if (!engine) {
      return NextResponse.json({ success: false, message: '❌ Nieznany silnik' })
    }

    try {
      switch (engine) {
        case 'ollama': {
          const base = (server || 'http://localhost:11434').replace(/\/$/, '')
          const tagsRes = await axios.get(`${base}/api/tags`, { timeout: 5000 })
          const models: string[] = (tagsRes.data?.models || []).map((m: any) => m.name)
          const targetModel = model || 'llama3.2:latest'
          if (!models.find(m => m === targetModel || m.startsWith(targetModel.split(':')[0]))) {
            return NextResponse.json({
              success: false,
              message: `⚠️ Ollama działa, ale model "${targetModel}" nie jest pobrany.\n\nDostępne modele:\n${models.slice(0, 8).join('\n') || '(brak)'}\n\nPobierz: ollama pull ${targetModel}`
            })
          }
          return NextResponse.json({
            success: true,
            message: `✅ Ollama działa!\n\nSerwer: ${base}\nModel: ${targetModel}\nDostępne modele: ${models.length}`
          })
        }

        case 'libretranslate': {
          const base = (server || 'http://localhost:5010').replace(/\/$/, '')
          const res = await axios.get(`${base}/languages`, { timeout: 5000 })
          const langs = res.data?.length || 0
          return NextResponse.json({ success: true, message: `✅ LibreTranslate działa!\n\nSerwer: ${base}\nJęzyki: ${langs}` })
        }

        case 'deeplx': {
          const base = (server || 'http://localhost:1188').replace(/\/$/, '')
          const headers: any = { 'Content-Type': 'application/json' }
          if (token) headers['Authorization'] = `Bearer ${token}`
          const res = await axios.post(`${base}/translate`, {
            text: 'Hello', source_lang: 'EN', target_lang: 'PL',
          }, { headers, timeout: 8000 })
          if (res.data?.data) {
            return NextResponse.json({ success: true, message: `✅ DeepLX działa!\n\nTest: "Hello" → "${res.data.data}"` })
          }
          throw new Error('Brak odpowiedzi')
        }

        case 'googlegtx': {
          const res = await axios.get('https://translate.googleapis.com/translate_a/single', {
            params: { client: 'gtx', sl: 'en', tl: 'pl', dt: 't', q: 'Hello' },
            timeout: 8000,
          })
          const translated = res.data?.[0]?.[0]?.[0] || '?'
          return NextResponse.json({ success: true, message: `✅ Google GTX działa!\n\nTest: "Hello" → "${translated}"` })
        }

        case 'deepseek': {
          if (!api_key) return NextResponse.json({ success: false, message: '❌ Brak klucza API DeepSeek' })
          const res = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: model || 'deepseek-chat',
            messages: [{ role: 'user', content: 'Say: OK' }],
            max_tokens: 5,
          }, {
            headers: { 'Authorization': `Bearer ${api_key}`, 'Content-Type': 'application/json' },
            timeout: 10000,
          })
          return NextResponse.json({ success: true, message: `✅ DeepSeek działa!\nModel: ${res.data?.model}` })
        }

        case 'openai': {
          if (!api_key) return NextResponse.json({ success: false, message: '❌ Brak klucza API OpenRouter' })
          const res = await axios.get('https://openrouter.ai/api/v1/auth/key', {
            headers: { 'Authorization': `Bearer ${api_key}` },
            timeout: 8000,
          })
          const info = res.data?.data
          return NextResponse.json({ success: true, message: `✅ OpenRouter działa!\nLimit: ${info?.limit ?? '?'} | Użyto: ${info?.usage ?? '?'}` })
        }

        case 'anthropic': {
          if (!api_key) return NextResponse.json({ success: false, message: '❌ Brak klucza API Anthropic' })
          const res = await axios.post('https://api.anthropic.com/v1/messages', {
            model: model || 'claude-3-haiku-20240307',
            max_tokens: 5,
            messages: [{ role: 'user', content: 'Say: OK' }],
          }, {
            headers: { 'x-api-key': api_key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
            timeout: 10000,
          })
          return NextResponse.json({ success: true, message: `✅ Anthropic Claude działa!\nModel: ${res.data?.model}` })
        }

        case 'deepl': {
          if (!auth_key) return NextResponse.json({ success: false, message: '❌ Brak klucza Auth DeepL' })
          const isFree = auth_key.endsWith(':fx')
          const base = isFree ? 'https://api-free.deepl.com' : 'https://api.deepl.com'
          const res = await axios.get(`${base}/v2/usage`, {
            headers: { 'Authorization': `DeepL-Auth-Key ${auth_key}` },
            timeout: 8000,
          })
          return NextResponse.json({ success: true, message: `✅ DeepL działa!\nZnaki: ${res.data?.character_count ?? '?'} / ${res.data?.character_limit ?? '?'}` })
        }

        default:
          return NextResponse.json({ success: true, message: `✅ ${engine} skonfigurowany` })
      }
    } catch (err: any) {
      const status = err.response?.status
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Nieznany błąd'
      if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
        return NextResponse.json({ success: false, message: `❌ Nie można połączyć z serwerem.\n\n${msg}` })
      }
      if (status === 401 || status === 403) {
        return NextResponse.json({ success: false, message: `❌ Nieprawidłowy klucz API.\n\n${msg}` })
      }
      return NextResponse.json({ success: false, message: `❌ Błąd: ${msg}` })
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: `❌ Błąd serwera: ${error.message}` }, { status: 500 })
  }
}
