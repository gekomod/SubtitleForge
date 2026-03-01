import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const CONFIG_FILE = path.join(process.cwd(), 'engine_configs.json')

export async function POST(
  request: NextRequest,
  { params }: { params: { engine: string } }
) {
  const { engine } = params
  
  try {
    // Wczytaj istniejące konfiguracje
    let configs = {}
    try {
      const data = await fs.readFile(CONFIG_FILE, 'utf-8')
      configs = JSON.parse(data)
    } catch {
      // Plik nie istnieje
    }

    // Aktualizuj konfigurację silnika
    const updates = await request.json()
    configs = {
      ...configs,
      [engine]: {
        ...(configs[engine as keyof typeof configs] || {}),
        ...updates
      }
    }

    // Zapisz
    await fs.writeFile(CONFIG_FILE, JSON.stringify(configs, null, 2))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save config' },
      { status: 500 }
    )
  }
}