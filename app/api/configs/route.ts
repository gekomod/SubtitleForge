import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DEFAULT_CONFIGS } from '@/lib/config/engines'

const CONFIG_FILE = path.join(process.cwd(), 'engine_configs.json')

// Interfejs dla konfiguracji silnika
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

export async function GET() {
  try {
    // Sprawdź czy plik istnieje
    try {
      await fs.access(CONFIG_FILE)
      const data = await fs.readFile(CONFIG_FILE, 'utf-8')
      const saved = JSON.parse(data)
      
      // Zawsze używaj DEFAULT_CONFIGS jako bazy
      const merged: Record<string, EngineConfig> = { ...DEFAULT_CONFIGS }
      
      // Dla każdego zapisanego klucza
      for (const [key, value] of Object.entries(saved)) {
        if (merged[key]) {
          // Ręczne mergowanie pól bez użycia spread na nieznanym typie
          merged[key] = {
            ...merged[key],           // najpierw domyślne
            name: value.name || merged[key].name,
            description: value.description || merged[key].description,
            enabled: value.enabled !== undefined ? value.enabled : merged[key].enabled,
            server: value.server || merged[key].server,
            api_key: value.api_key || merged[key].api_key,
            model: value.model || merged[key].model,
            token: value.token || merged[key].token,
            auth_key: value.auth_key || merged[key].auth_key,
            type: value.type || merged[key].type,
            endpoint: value.endpoint || merged[key].endpoint,
            region: value.region || merged[key].region,
            api_url: value.api_url || merged[key].api_url,
            popular: value.popular !== undefined ? value.popular : merged[key].popular,
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
    const configs = await request.json()
    
    // Przed zapisem, usuń/zignoruj pola icon jeśli są
    const configsToSave: Record<string, any> = { ...configs }
    Object.keys(configsToSave).forEach(key => {
      if (configsToSave[key].icon) {
        // Nie zapisuj ikony - zawsze używaj domyślnej
        delete configsToSave[key].icon
        delete configsToSave[key].iconColor
        delete configsToSave[key].iconBg
      }
    })
    
    await fs.writeFile(CONFIG_FILE, JSON.stringify(configsToSave, null, 2))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to save configs' },
      { status: 500 }
    )
  }
}