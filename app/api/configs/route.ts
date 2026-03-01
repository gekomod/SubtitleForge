import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DEFAULT_CONFIGS } from '@/lib/config/engines'

const CONFIG_FILE = path.join(process.cwd(), 'engine_configs.json')

// Interfejs dla konfiguracji silnika (zgodny z DEFAULT_CONFIGS)
interface EngineConfig {
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

// Typ dla zapisanych danych (mogą być niekompletne)
interface SavedEngineConfig {
  name?: string
  icon?: string
  iconColor?: string
  iconBg?: string
  description?: string
  enabled?: boolean
  server?: string
  api_key?: string
  model?: string
  token?: string
  auth_key?: string
  type?: string
  endpoint?: string
  region?: string
  api_url?: string
  popular?: boolean
}

export async function GET() {
  try {
    // Sprawdź czy plik istnieje
    try {
      await fs.access(CONFIG_FILE)
      const data = await fs.readFile(CONFIG_FILE, 'utf-8')
      const saved = JSON.parse(data) as Record<string, SavedEngineConfig>
      
      // Zawsze używaj DEFAULT_CONFIGS jako bazy
      const merged: Record<string, EngineConfig> = { ...DEFAULT_CONFIGS }
      
      // Dla każdego zapisanego klucza
      for (const [key, savedValue] of Object.entries(saved)) {
        if (merged[key] && savedValue) {
          // Ręczne mergowanie pól z zachowaniem typów
          merged[key] = {
            ...merged[key],
            name: savedValue.name ?? merged[key].name,
            description: savedValue.description ?? merged[key].description,
            enabled: savedValue.enabled ?? merged[key].enabled,
            server: savedValue.server ?? merged[key].server,
            api_key: savedValue.api_key ?? merged[key].api_key,
            model: savedValue.model ?? merged[key].model,
            token: savedValue.token ?? merged[key].token,
            auth_key: savedValue.auth_key ?? merged[key].auth_key,
            type: savedValue.type as 'free' | 'pro' ?? merged[key].type,
            endpoint: savedValue.endpoint ?? merged[key].endpoint,
            region: savedValue.region ?? merged[key].region,
            api_url: savedValue.api_url ?? merged[key].api_url,
            popular: savedValue.popular ?? merged[key].popular,
            // ZAWSZE używaj ikon z DEFAULT
            icon: merged[key].icon,
            iconColor: merged[key].iconColor,
            iconBg: merged[key].iconBg
          }
        }
      }
      
      console.log('API returning configs with icons:', Object.entries(merged).map(([k, v]) => ({
        key: k,
        icon: v.icon
      })))
      
      return NextResponse.json(merged)
    } catch {
      // Plik nie istnieje - zwróć domyślne
      console.log('No config file, returning defaults with icons:', 
        Object.entries(DEFAULT_CONFIGS).map(([k, v]) => ({ key: k, icon: v.icon }))
      )
      return NextResponse.json(DEFAULT_CONFIGS)
    }
  } catch (error) {
    console.error('Error loading configs:', error)
    return NextResponse.json(DEFAULT_CONFIGS)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const configs = body as Record<string, SavedEngineConfig>
    
    // Przed zapisem, usuń pola ikon jeśli są
    const configsToSave: Record<string, SavedEngineConfig> = {}
    
    for (const [key, value] of Object.entries(configs)) {
      if (value) {
        // Kopiuj tylko potrzebne pola, bez ikon
        configsToSave[key] = {
          name: value.name,
          description: value.description,
          enabled: value.enabled,
          server: value.server,
          api_key: value.api_key,
          model: value.model,
          token: value.token,
          auth_key: value.auth_key,
          type: value.type,
          endpoint: value.endpoint,
          region: value.region,
          api_url: value.api_url,
          popular: value.popular
        }
      }
    }
    
    await fs.writeFile(CONFIG_FILE, JSON.stringify(configsToSave, null, 2))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving configs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save configs' },
      { status: 500 }
    )
  }
}