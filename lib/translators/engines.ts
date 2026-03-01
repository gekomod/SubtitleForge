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
      const server = config.server || 'http://localhost:11434'
      const model = config.model || 'llama3.2:latest'
      
      const prompt = `Translate the following text from ${sourceLang === 'auto' ? 'the detected language' : sourceLang} to ${targetLang}. Return only the translation, no explanations:\n\n${text}`
      
      const response = await axios.post(
        `${server}/api/generate`,
        {
          model,
          prompt,
          stream: false,
        },
        { timeout: 30000 }
      )
      
      return response.data.response.trim()
    } catch (error) {
      console.error('Ollama error:', error)
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