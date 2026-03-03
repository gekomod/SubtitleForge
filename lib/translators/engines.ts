import axios from 'axios'

// Interfejs dla silnika tłumaczenia
export interface TranslationEngine {
  translate(text: string, sourceLang: string, targetLang: string, config: any): Promise<string>
}

// Google Translate (GTX) - darmowy
export class GoogleGTXEngine implements TranslationEngine {
  async translate(text: string, sourceLang: string, targetLang: string, config: any): Promise<string> {
    try {
      const response = await axios.get('https://translate.googleapis.com/translate_a/single', {
        params: {
          client: 'gtx',
          sl: sourceLang === 'auto' ? 'auto' : sourceLang,
          tl: targetLang,
          dt: 't',
          q: text,
        },
        timeout: 10000,
      })
      
      if (response.data && response.data[0]) {
        return response.data[0].map((item: any[]) => item[0]).join('')
      }
      throw new Error('No translation returned')
    } catch (error) {
      console.error('Google GTX error:', error)
      throw error
    }
  }
}

// LibreTranslate
export class LibreTranslateEngine implements TranslationEngine {
  async translate(text: string, sourceLang: string, targetLang: string, config: any): Promise<string> {
    try {
      const server = config.server || 'http://localhost:5010'
      const response = await axios.post(
        `${server}/translate`,
        {
          q: text,
          source: sourceLang === 'auto' ? 'en' : sourceLang,
          target: targetLang,
          format: 'text',
          api_key: config.api_key || '',
        },
        { timeout: 10000 }
      )
      return response.data.translatedText
    } catch (error) {
      console.error('LibreTranslate error:', error)
      throw error
    }
  }
}

// DeepLX
export class DeepLXEngine implements TranslationEngine {
  async translate(text: string, sourceLang: string, targetLang: string, config: any): Promise<string> {
    try {
      const server = config.server || 'http://localhost:1188'
      const headers: any = {
        'Content-Type': 'application/json',
      }
      
      if (config.token) {
        headers['Authorization'] = `Bearer ${config.token}`
      }
      
      const response = await axios.post(
        `${server}/translate`,
        {
          text,
          source_lang: sourceLang === 'auto' ? 'auto' : sourceLang.toUpperCase(),
          target_lang: targetLang.toUpperCase(),
        },
        { headers, timeout: 10000 }
      )
      
      return response.data.data
    } catch (error) {
      console.error('DeepLX error:', error)
      throw error
    }
  }
}

// Ollama
export class OllamaEngine implements TranslationEngine {
  async translate(text: string, sourceLang: string, targetLang: string, config: any): Promise<string> {
    try {
      const server = (config.server || 'http://localhost:11434').replace(/\/$/, '')
      const model = config.model || 'llama3.2:latest'

      const LANG_NAMES: Record<string, string> = {
        pl: 'Polish', en: 'English', de: 'German', fr: 'French',
        es: 'Spanish', it: 'Italian', ru: 'Russian', uk: 'Ukrainian',
        cs: 'Czech', sk: 'Slovak', zh: 'Chinese', ja: 'Japanese',
        ko: 'Korean', ar: 'Arabic', pt: 'Portuguese', nl: 'Dutch',
      }
      const srcName = sourceLang === 'auto' ? 'the source language' : (LANG_NAMES[sourceLang] || sourceLang)
      const tgtName = LANG_NAMES[targetLang] || targetLang

      // Models using {{ .Content }} template (e.g. jnowakk11/translate-polish) MUST use /api/chat.
      // /api/generate fills {{ .Prompt }} not {{ .Content }}, producing "<no value>" output.
      const isSpecialistModel = /translat/i.test(model)

      console.log(`Ollama: ${server} model=${model} specialist=${isSpecialistModel} chars=${text.length}`)

      let rawResponse: string

      if (isSpecialistModel) {
        // /api/chat correctly fills {{ .Content }} in custom Modelfile templates.
        // Send raw text only — the model built-in SYSTEM handles EN→PL translation.
        const res = await axios.post(
          `${server}/api/chat`,
          {
            model,
            messages: [{ role: 'user', content: text }],
            stream: false,
            options: { temperature: 0.1, num_predict: Math.max(200, text.length * 4) },
          },
          { timeout: 120000, headers: { 'Content-Type': 'application/json' } }
        )
        rawResponse = res.data?.message?.content ?? ''
        console.log(`Ollama chat (${model}): "${rawResponse.substring(0, 120)}"`)
      } else {
        // General models: /api/generate with instruction prompt
        const prompt = `Translate from ${srcName} to ${tgtName}. Output ONLY the translation, nothing else.\n\n${text}`
        const res = await axios.post(
          `${server}/api/generate`,
          {
            model,
            prompt,
            stream: false,
            options: { temperature: 0.1, num_predict: Math.max(200, text.length * 4), top_k: 40, repeat_penalty: 1.1 },
          },
          { timeout: 120000, headers: { 'Content-Type': 'application/json' } }
        )
        rawResponse = res.data?.response ?? ''
        console.log(`Ollama generate (${model}): "${rawResponse.substring(0, 120)}"`)

        // Strip common preamble from general models
        rawResponse = rawResponse
          .replace(/^(Translation|Tłumaczenie|Translated text|Output|Result)\s*[:：]\s*/i, '')
          .replace(/^["'`]|["'`]$/g, '')
          .replace(/^(Here is|Here\'s|Oto)\s+.*?:\s*/i, '')
          .trim()
      }

      // Safety: if model returned Go template artifact or empty string, use original
      if (!rawResponse || rawResponse.includes('<no value>')) {
        console.warn(`Ollama bad response for "${text.substring(0, 50)}" — using original`)
        return text
      }

      return rawResponse

    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
        throw new Error(`Nie można połączyć z Ollama (${config.server}). Upewnij się że Ollama działa: ollama serve`)
      }
      if (error.response?.status === 404) {
        throw new Error(`Model "${config.model}" nie znaleziony. Pobierz go: ollama pull ${config.model}`)
      }
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        throw new Error(`Timeout — model "${config.model}" za wolno odpowiada. Spróbuj mniejszego modelu.`)
      }
      console.error('Ollama error:', error.message, error.response?.data)
      throw error
    }
  }
}
// DeepSeek
export class DeepSeekEngine implements TranslationEngine {
  async translate(text: string, sourceLang: string, targetLang: string, config: any): Promise<string> {
    try {
      const apiKey = config.api_key
      if (!apiKey) throw new Error('DeepSeek API key required')
      
      const model = config.model || 'deepseek-chat'
      
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model,
          messages: [
            {
              role: 'system',
              content: `You are a translator. Translate the following text from ${sourceLang === 'auto' ? 'the detected language' : sourceLang} to ${targetLang}. Return only the translation, no explanations.`,
            },
            {
              role: 'user',
              content: text,
            },
          ],
          temperature: 0.3,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      )
      
      return response.data.choices[0].message.content.trim()
    } catch (error) {
      console.error('DeepSeek error:', error)
      throw error
    }
  }
}

// OpenRouter
export class OpenRouterEngine implements TranslationEngine {
  async translate(text: string, sourceLang: string, targetLang: string, config: any): Promise<string> {
    try {
      const apiKey = config.api_key
      if (!apiKey) throw new Error('OpenRouter API key required')
      
      const model = config.model || 'meta-llama/llama-3.2-3b-instruct:free'
      
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model,
          messages: [
            {
              role: 'system',
              content: `You are a translator. Translate the following text from ${sourceLang === 'auto' ? 'the detected language' : sourceLang} to ${targetLang}. Return only the translation, no explanations.`,
            },
            {
              role: 'user',
              content: text,
            },
          ],
          temperature: 0.3,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'SubtitleForge',
          },
          timeout: 30000,
        }
      )
      
      return response.data.choices[0].message.content.trim()
    } catch (error) {
      console.error('OpenRouter error:', error)
      throw error
    }
  }
}

// Anthropic Claude
export class AnthropicEngine implements TranslationEngine {
  async translate(text: string, sourceLang: string, targetLang: string, config: any): Promise<string> {
    const apiKey = config.api_key
    if (!apiKey) throw new Error('Anthropic API key required')
    const model = config.model || 'claude-3-haiku-20240307'
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model,
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Translate from ${sourceLang === 'auto' ? 'detected language' : sourceLang} to ${targetLang}. Return ONLY the translation:\n\n${text}`
        }],
      },
      {
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    )
    return response.data.content[0].text.trim()
  }
}

// Azure Translator
export class AzureEngine implements TranslationEngine {
  async translate(text: string, sourceLang: string, targetLang: string, config: any): Promise<string> {
    const apiKey = config.api_key
    if (!apiKey) throw new Error('Azure API key required')
    const endpoint = config.endpoint || 'https://api.cognitive.microsofttranslator.com'
    const region = config.region || 'westeurope'
    const params: any = { 'api-version': '3.0', to: targetLang }
    if (sourceLang !== 'auto') params.from = sourceLang
    const response = await axios.post(
      `${endpoint}/translate`,
      [{ text }],
      {
        params,
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
          'Ocp-Apim-Subscription-Region': region,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    )
    return response.data[0].translations[0].text
  }
}

// Google Cloud Translation
export class GoogleCloudEngine implements TranslationEngine {
  async translate(text: string, sourceLang: string, targetLang: string, config: any): Promise<string> {
    const apiKey = config.api_key
    if (!apiKey) throw new Error('Google Cloud API key required')
    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      { q: text, target: targetLang, source: sourceLang === 'auto' ? undefined : sourceLang, format: 'text' },
      { timeout: 15000 }
    )
    return response.data.data.translations[0].translatedText
  }
}

// DeepL Pro
export class DeepLEngine implements TranslationEngine {
  async translate(text: string, sourceLang: string, targetLang: string, config: any): Promise<string> {
    const authKey = config.auth_key
    if (!authKey) throw new Error('DeepL auth key required')
    const isFree = authKey.endsWith(':fx')
    const baseUrl = isFree ? 'https://api-free.deepl.com' : 'https://api.deepl.com'
    const response = await axios.post(
      `${baseUrl}/v2/translate`,
      {
        text: [text],
        target_lang: targetLang.toUpperCase(),
        source_lang: sourceLang === 'auto' ? undefined : sourceLang.toUpperCase(),
      },
      {
        headers: { 'Authorization': `DeepL-Auth-Key ${authKey}`, 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    )
    return response.data.translations[0].text
  }
}

// Custom API (OpenAI-compatible)
export class CustomEngine implements TranslationEngine {
  async translate(text: string, sourceLang: string, targetLang: string, config: any): Promise<string> {
    const apiUrl = config.api_url
    if (!apiUrl) throw new Error('Custom API URL required')
    const response = await axios.post(
      apiUrl,
      {
        model: config.model || 'default',
        messages: [
          { role: 'system', content: `Translate from ${sourceLang} to ${targetLang}. Return only the translation.` },
          { role: 'user', content: text },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(config.api_key ? { 'Authorization': `Bearer ${config.api_key}` } : {}),
        },
        timeout: 30000,
      }
    )
    return response.data.choices[0].message.content.trim()
  }
}

// Mapowanie silników
const engines: Record<string, TranslationEngine> = {
  googlegtx: new GoogleGTXEngine(),
  libretranslate: new LibreTranslateEngine(),
  deeplx: new DeepLXEngine(),
  ollama: new OllamaEngine(),
  deepseek: new DeepSeekEngine(),
  openai: new OpenRouterEngine(),
  anthropic: new AnthropicEngine(),
  azure: new AzureEngine(),
  google: new GoogleCloudEngine(),
  deepl: new DeepLEngine(),
  custom: new CustomEngine(),
}

export async function translate(
  text: string,
  engine: string,
  sourceLang: string,
  targetLang: string,
  config: any
): Promise<string> {
  const translator = engines[engine]
  if (!translator) {
    throw new Error(`Unknown engine: ${engine}`)
  }
  
  return translator.translate(text, sourceLang, targetLang, config)
}