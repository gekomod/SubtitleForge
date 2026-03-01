import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const CONFIG_FILE = path.join(process.cwd(), 'engine_configs.json')

interface EngineConfig {
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
  popular?: boolean
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ engine: string }> }
) {
  try {
    const { engine } = await params
    const updates = await request.json()

    let configs: Record<string, EngineConfig> = {}
    try {
      const data = await fs.readFile(CONFIG_FILE, 'utf-8')
      configs = JSON.parse(data)
    } catch {
      configs = {}
    }

    const currentConfig = configs[engine] || {}

    configs = {
      ...configs,
      [engine]: {
        ...currentConfig,
        ...updates
      }
    }

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