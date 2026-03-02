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

// Ollama - POPRAWIONA WERSJA
export class OllamaEngine implements TranslationEngine {
  async translate(text: string, sourceLang: string, targetLang: string, config: any): Promise<string> {
    try {
      const server = config.server || 'http://192.168.1.35:11434'
      const baseUrl = server.replace(/\/$/, '')
      
      // Wybierz najlepszy model do tłumaczeń
      const model = config.model || 'gemma3:4b' // Zmiana domyślnego modelu na gemma3:4b
      
      console.log('Translating with Ollama:', { baseUrl, model, textLength: text.length })
      
      // Określ języki dla promptu
      const sourceLangName = sourceLang === 'auto' ? 'the original' : 
                            (sourceLang === 'pl' ? 'Polish' : 
                             sourceLang === 'en' ? 'English' : sourceLang)
      const targetLangName = targetLang === 'pl' ? 'Polish' : 
                            (targetLang === 'en' ? 'English' : targetLang)
      
      // Lepszy prompt dla tłumaczeń
      const prompt = `You are a professional translator. Translate the following text from ${sourceLangName} to ${targetLangName}. Return ONLY the translation, no explanations, no additional text, no quotes.

Original text: ${text}

Translation:`
      
      console.log('Prompt:', prompt.substring(0, 100) + '...')
      
      const response = await axios.post(
        `${baseUrl}/api/generate`,
        {
          model,
          prompt,
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 500,
            top_k: 20,
            top_p: 0.9,
            repeat_penalty: 1.1
          }
        },
        { 
          timeout: 60000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (!response.data || !response.data.response) {
        throw new Error('No response from Ollama')
      }
      
      // Wyczyść odpowiedź
      let translated = response.data.response.trim()
      
      // Usuń "Translation:" jeśli model zwrócił
      translated = translated.replace(/^Translation:\s*/i, '')
      // Usuń cudzysłowy
      translated = translated.replace(/^["']|["']$/g, '')
      // Usuń "Odpowiedź:" itp
      translated = translated.replace(/^(Answer:|Response:|Odpowiedź:)\s*/i, '')
      
      console.log('Translated:', translated.substring(0, 100))
      
      return translated
    } catch (error: any) {
      console.error('Ollama error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config?.url
      })
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to Ollama at ${config.server}. Make sure Ollama is running (ollama serve)`)
      }
      if (error.response?.status === 404) {
        throw new Error(`Model '${config.model}' not found. Available models: llama3.2:1b, gemma3:4b, translator-pl-en:latest`)
      }
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

// Mapowanie silników
const engines: Record<string, TranslationEngine> = {
  googlegtx: new GoogleGTXEngine(),
  libretranslate: new LibreTranslateEngine(),
  deeplx: new DeepLXEngine(),
  ollama: new OllamaEngine(),
  deepseek: new DeepSeekEngine(),
  openai: new OpenRouterEngine(),
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