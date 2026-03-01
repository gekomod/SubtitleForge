import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const CONFIG_FILE = path.join(process.cwd(), 'engine_configs.json')

interface EngineConfig {
  enabled: boolean
  name?: string
  icon?: string
  description?: string
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
    const { enabled } = await request.json()
    
    let configs: Record<string, EngineConfig> = {}
    try {
      const data = await fs.readFile(CONFIG_FILE, 'utf-8')
      configs = JSON.parse(data)
    } catch {
      configs = {}
    }

    if (configs[engine]) {
      configs[engine] = {
        ...configs[engine],
        enabled
      }
    } else {
      configs[engine] = {
        enabled,
        name: engine,
        description: `Custom ${engine} engine`
      }
    }

    await fs.writeFile(CONFIG_FILE, JSON.stringify(configs, null, 2))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error toggling engine:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to toggle engine' },
      { status: 500 }
    )
  }
}