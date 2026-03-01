'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface ConfigModalProps {
  isOpen: boolean
  onClose: () => void
  engine: string
  config: any
  onSave: (engine: string, config: any) => void
  onTest: (engine: string, config: any) => void
}

// Mapowanie ikon i kolorów dla poszczególnych silników
const ENGINE_STYLES: Record<string, { icon: string; color: string; bg: string }> = {
  libretranslate: { icon: 'bi-globe', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  googlegtx: { icon: 'bi-google', color: 'text-blue-500', bg: 'bg-blue-500/20' },
  ollama: { icon: 'bi-robot', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  deeplx: { icon: 'bi-translate', color: 'text-pink-400', bg: 'bg-pink-500/20' },
  deepseek: { icon: 'bi-cpu', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  openai: { icon: 'bi-bolt', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  anthropic: { icon: 'bi-brain', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  azure: { icon: 'bi-cloud', color: 'text-sky-400', bg: 'bg-sky-500/20' },
  google: { icon: 'bi-google', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  deepl: { icon: 'bi-rocket', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  custom: { icon: 'bi-code-square', color: 'text-gray-400', bg: 'bg-gray-500/20' },
}

export default function ConfigModal({
  isOpen,
  onClose,
  engine,
  config,
  onSave,
  onTest,
}: ConfigModalProps) {
  const [localConfig, setLocalConfig] = useState(config || {})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (config) {
      setLocalConfig(config)
    }
  }, [config])

  if (!isOpen || !mounted) return null

  const engineStyle = ENGINE_STYLES[engine] || { icon: 'bi-cpu', color: 'text-purple-400', bg: 'bg-purple-500/20' }

  const handleSave = () => {
    onSave(engine, localConfig)
  }

  const handleTest = () => {
    onTest(engine, localConfig)
  }

  const renderFields = () => {
    if (!localConfig) return null

    switch (engine) {
      case 'libretranslate':
        return (
          <>
            <div className="mb-4">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#666980] mb-1.5">
                <i className="bi bi-server text-blue-400 text-xs"></i>
                Server URL
              </label>
              <input
                type="text"
                className="w-full p-3 border border-[rgba(255,255,255,0.07)] rounded-[14px] bg-[#0e1016] text-[#dde0ed] text-sm focus:border-[#7c5af0] focus:outline-none"
                value={localConfig.server || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, server: e.target.value })}
                placeholder="http://localhost:5010"
              />
            </div>
          </>
        )

      case 'ollama':
        return (
          <>
            <div className="mb-4">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#666980] mb-1.5">
                <i className="bi bi-server text-purple-400 text-xs"></i>
                API URL
              </label>
              <input
                type="text"
                className="w-full p-3 border border-[rgba(255,255,255,0.07)] rounded-[14px] bg-[#0e1016] text-[#dde0ed] text-sm focus:border-[#7c5af0] focus:outline-none"
                value={localConfig.server || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, server: e.target.value })}
                placeholder="http://localhost:11434"
              />
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#666980] mb-1.5">
                <i className="bi bi-cpu text-purple-400 text-xs"></i>
                Model
              </label>
              <input
                type="text"
                className="w-full p-3 border border-[rgba(255,255,255,0.07)] rounded-[14px] bg-[#0e1016] text-[#dde0ed] text-sm focus:border-[#7c5af0] focus:outline-none"
                value={localConfig.model || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                placeholder="llama3.2:latest"
              />
            </div>
          </>
        )

      case 'openai':
        return (
          <>
            <div className="mb-4">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#666980] mb-1.5">
                <i className="bi bi-key text-yellow-400 text-xs"></i>
                OpenRouter API Key
              </label>
              <input
                type="password"
                className="w-full p-3 border border-[rgba(255,255,255,0.07)] rounded-[14px] bg-[#0e1016] text-[#dde0ed] text-sm focus:border-[#7c5af0] focus:outline-none"
                value={localConfig.api_key || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, api_key: e.target.value })}
                placeholder="sk-or-v1-..."
              />
              <small className="text-[#666980] block mt-1 text-[11px]">
                Klucz z <a href="https://openrouter.ai/keys" target="_blank" className="text-yellow-400 hover:underline">openrouter.ai/keys</a>
              </small>
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#666980] mb-1.5">
                <i className="bi bi-cpu text-yellow-400 text-xs"></i>
                Model
              </label>
              <input
                type="text"
                className="w-full p-3 border border-[rgba(255,255,255,0.07)] rounded-[14px] bg-[#0e1016] text-[#dde0ed] text-sm focus:border-[#7c5af0] focus:outline-none"
                value={localConfig.model || 'meta-llama/llama-3.2-3b-instruct:free'}
                onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
              />
            </div>
          </>
        )

      default:
        return (
          <>
            <div className="mb-4">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#666980] mb-1.5">
                <i className="bi bi-key text-purple-400 text-xs"></i>
                API Key
              </label>
              <input
                type="password"
                className="w-full p-3 border border-[rgba(255,255,255,0.07)] rounded-[14px] bg-[#0e1016] text-[#dde0ed] text-sm focus:border-[#7c5af0] focus:outline-none"
                value={localConfig.api_key || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, api_key: e.target.value })}
                placeholder="Enter API key"
              />
            </div>
          </>
        )
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-[#13151f] rounded-[28px] border border-[rgba(255,255,255,0.13)] text-[#dde0ed] w-full max-w-md mx-4 shadow-2xl">
        <div className="border-b border-[rgba(255,255,255,0.07)] py-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${engineStyle.bg} ${engineStyle.color} rounded-[12px] flex items-center justify-center text-lg`}>
              <i className={`bi ${engineStyle.icon}`}></i>
            </div>
            <h5 className="text-base font-semibold">
              {config?.name || 'Engine'} Configuration
            </h5>
          </div>
          <button onClick={onClose} className="text-[#666980] hover:text-[#dde0ed] transition-colors">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#666980]">
                <i className="bi bi-power text-[#7c5af0] text-xs mr-1"></i>
                Status silnika
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded bg-[#1a1d2a] border-[rgba(255,255,255,0.13)] cursor-pointer checked:bg-[#7c5af0] checked:border-[#7c5af0]"
                  checked={localConfig.enabled !== false}
                  onChange={(e) => setLocalConfig({ ...localConfig, enabled: e.target.checked })}
                />
                <span className="text-xs text-[#dde0ed]">
                  {localConfig.enabled !== false ? 'Włączony' : 'Wyłączony'}
                </span>
              </div>
            </div>
          </div>

          <hr className="my-3 border-[rgba(255,255,255,0.07)]" />

          {renderFields()}

          <hr className="my-3 border-[rgba(255,255,255,0.07)]" />

          <div className="flex gap-2 mt-4">
            <button
              className="flex-1 bg-gradient-to-r from-[#7c5af0] to-[#9d7ef5] text-white border-none py-2.5 px-4 rounded-[14px] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg hover:shadow-purple-500/30 transition-all"
              onClick={handleSave}
            >
              <i className="bi bi-save"></i>
              Save
            </button>
            <button
              className="flex-1 border border-[#7c5af0] text-[#7c5af0] bg-transparent py-2.5 px-4 rounded-[14px] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-[rgba(124,90,240,0.14)] transition-all"
              onClick={handleTest}
            >
              <i className="bi bi-flask"></i>
              Test
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}