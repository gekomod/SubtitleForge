export interface EngineConfig {
  name: string
  icon: string
  iconColor: string
  iconBg: string
  description: string
  enabled: boolean
  server?: string
  api_key?: string
  model?: string
  token?: string
  auth_key?: string
  type?: 'free' | 'pro'
  endpoint?: string
  region?: string
  api_url?: string
  popular?: boolean
}

export const DEFAULT_CONFIGS: Record<string, EngineConfig> = {
  libretranslate: {
    name: 'LibreTranslate',
    icon: 'bi-translate', // ZMIANA: używamy bi-globe zamiast bi-translate
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/20',
    description: 'Open source, lokalny serwer',
    server: process.env.LIBRETRANSLATE_SERVER || 'http://localhost:5010',
    api_key: '',
    enabled: true,
    popular: true
  },
  googlegtx: {
    name: 'Google GTX',
    icon: 'bi-google',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500/20',
    description: 'Darmowe API Google Translate',
    enabled: true,
    popular: true
  },
  ollama: {
    name: 'Ollama',
    icon: 'bi-robot',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/20',
    description: 'Lokalne modele AI',
    server: process.env.OLLAMA_SERVER || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.2:latest',
    api_key: '',
    enabled: true,
    popular: true
  },
  deeplx: {
    name: 'DeepLX',
    icon: 'bi-translate', // DeepLX zostaje z bi-translate
    iconColor: 'text-pink-400',
    iconBg: 'bg-pink-500/20',
    description: 'Darmowy proxy DeepL',
    server: process.env.DEEPLX_SERVER || 'http://localhost:1188',
    token: process.env.DEEPLX_TOKEN || '',
    api_key: '',
    enabled: true,
    popular: true
  },
  deepseek: {
    name: 'DeepSeek',
    icon: 'bi-cpu',
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/20',
    description: 'Zaawansowane modele AI',
    api_key: process.env.DEEPSEEK_API_KEY || '',
    model: 'deepseek-chat',
    enabled: false
  },
  openai: {
    name: 'OpenRouter',
    icon: 'bi-diagram-3',
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/20',
    description: 'OpenRouter API (Llama, GPT, Claude)',
    api_key: process.env.OPENROUTER_API_KEY || '',
    model: 'meta-llama/llama-3.2-3b-instruct:free',
    enabled: false,
    popular: true
  },
  anthropic: {
    name: 'Claude',
    icon: 'bi-chat-dots',
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/20',
    description: 'Anthropic Claude API',
    api_key: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-3-haiku-20240307',
    enabled: false
  },
  azure: {
    name: 'Azure',
    icon: 'bi-cloud',
    iconColor: 'text-sky-400',
    iconBg: 'bg-sky-500/20',
    description: 'Microsoft Translator',
    api_key: process.env.AZURE_API_KEY || '',
    endpoint: 'https://api.cognitive.microsofttranslator.com',
    region: process.env.AZURE_REGION || 'westeurope',
    enabled: false
  },
  google: {
    name: 'Google Cloud',
    icon: 'bi-google',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/20',
    description: 'Google Cloud Translation',
    api_key: process.env.GOOGLE_API_KEY || '',
    enabled: false
  },
  deepl: {
    name: 'DeepL Pro',
    icon: 'bi-rocket',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/20',
    description: 'Premium translation API',
    auth_key: process.env.DEEPL_AUTH_KEY || '',
    type: (process.env.DEEPL_TYPE as 'free' | 'pro') || 'free',
    enabled: false
  },
  custom: {
    name: 'Custom API',
    icon: 'bi-code',
    iconColor: 'text-gray-400',
    iconBg: 'bg-gray-500/20',
    description: 'Własne API',
    api_url: '',
    api_key: '',
    model: '',
    enabled: false
  }
}
