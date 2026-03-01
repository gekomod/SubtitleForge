import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DEFAULT_CONFIGS } from '@/lib/config/engines'

const CONFIG_FILE = path.join(process.cwd(), 'engine_configs.json')

export async function GET() {
  try {
    // Sprawdź czy plik istnieje
    try {
      await fs.access(CONFIG_FILE)
      const data = await fs.readFile(CONFIG_FILE, 'utf-8')
      const saved = JSON.parse(data)
      
      // WAŻNE: ZAWSZE używaj DEFAULT_CONFIGS jako bazy
      // i tylko nadpisuj zapisanymi wartościami, ale zachowaj ikony z DEFAULT
      const merged = { ...DEFAULT_CONFIGS }
      
      for (const [key, value] of Object.entries(saved)) {
        if (merged[key]) {
          // Nadpisz tylko te pola które są w saved, ale zachowaj ikonę z DEFAULT
          merged[key] = {
            ...merged[key],           // najpierw domyślne (z bi-*)
            ...value,                 // potem zapisane (mogą mieć fa-*)
            icon: merged[key].icon,   // ZAWSZE używaj ikony z DEFAULT (bi-*)
            iconColor: merged[key].iconColor, // zachowaj kolory z DEFAULT
            iconBg: merged[key].iconBg
          }
        }
      }
      
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
    const configsToSave = { ...configs }
    Object.keys(configsToSave).forEach(key => {
      if (configsToSave[key].icon) {
        // Nie zapisuj ikony - zawsze używaj domyślnej
        delete configsToSave[key].icon
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
