'use client'

import { useState, useEffect, useRef } from 'react'

interface EngineConfig {
  name: string
  icon: string
  iconColor?: string
  iconBg?: string
  description: string
  enabled: boolean
  popular?: boolean
}

interface EngineSelectorProps {
  engines: Record<string, EngineConfig>
  selectedEngine: string | null
  onSelect: (engine: string) => void
  onOpenConfig: (engine: string) => void
}

// Mapowanie kolorów dla poszczególnych silników
const ENGINE_COLORS: Record<string, { color: string; bg: string }> = {
  libretranslate: { color: 'text-blue-400', bg: 'bg-blue-500/20' },
  googlegtx: { color: 'text-blue-500', bg: 'bg-blue-500/20' },
  ollama: { color: 'text-purple-400', bg: 'bg-purple-500/20' },
  deeplx: { color: 'text-pink-400', bg: 'bg-pink-500/20' },
  deepseek: { color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  openai: { color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  anthropic: { color: 'text-orange-400', bg: 'bg-orange-500/20' },
  azure: { color: 'text-sky-400', bg: 'bg-sky-500/20' },
  google: { color: 'text-blue-400', bg: 'bg-blue-500/20' },
  deepl: { color: 'text-purple-400', bg: 'bg-purple-500/20' },
  custom: { color: 'text-gray-400', bg: 'bg-gray-500/20' },
}

export default function EngineSelector({
  engines,
  selectedEngine,
  onSelect,
  onOpenConfig,
}: EngineSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selectorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        selectorRef.current &&
        !selectorRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const selectedConfig = selectedEngine ? engines[selectedEngine] : null

  // Pobierz kolory dla silnika
  const getEngineColors = (engineKey: string, config?: EngineConfig) => {
    if (config?.iconColor && config?.iconBg) {
      return { color: config.iconColor, bg: config.iconBg }
    }
    return ENGINE_COLORS[engineKey] || { color: 'text-purple-400', bg: 'bg-purple-500/20' }
  }

  return (
    <div className="relative">
      {/* Selected engine display */}
      <div
        ref={selectorRef}
        className="bg-[#13151f] border border-[rgba(255,255,255,0.07)] rounded-[20px] p-4 cursor-pointer flex items-center justify-between gap-3 transition-all duration-200 hover:border-[#7c5af0]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3.5">
          {selectedConfig ? (
            <>
              {(() => {
                const colors = getEngineColors(selectedEngine!, selectedConfig)
                return (
                  <div className={`w-11 h-11 flex-shrink-0 rounded-[14px] flex items-center justify-center text-xl ${colors.bg} ${colors.color}`}>
                    <i className={`bi ${selectedConfig.icon}`}></i>
                  </div>
                )
              })()}
              <div>
                <div className="font-semibold text-sm text-[#dde0ed]">
                  {selectedConfig.name}
                </div>
                <div className="text-xs text-[#666980] mt-0.5">
                  {selectedConfig.description}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-11 h-11 flex-shrink-0 bg-[#1a1d2a] rounded-[14px] flex items-center justify-center text-xl text-[#666980]">
                <i className="bi bi-cpu"></i>
              </div>
              <div>
                <div className="font-semibold text-sm text-[#dde0ed]">
                  Wybierz silnik AI
                </div>
                <div className="text-xs text-[#666980] mt-0.5">
                  Wybierz dostawcę tłumaczeń
                </div>
              </div>
            </>
          )}
        </div>
        <i className={`bi bi-chevron-down text-[#666980] text-sm flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div ref={dropdownRef} className="absolute w-full z-50 bg-[#13151f] border border-[rgba(255,255,255,0.13)] rounded-[20px] mt-1.5 p-1.5 shadow-2xl animate-dropIn max-h-96 overflow-y-auto">
          {/* Popular engines section */}
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#666980] sticky top-0 bg-[#13151f]">
            Popularne
          </div>
          {Object.entries(engines)
            .filter(([_, config]) => config.popular)
            .map(([key, config]) => {
              const colors = getEngineColors(key, config)
              return (
                <EngineOption
                  key={key}
                  engineKey={key}
                  config={config}
                  colors={colors}
                  isSelected={selectedEngine === key}
                  onSelect={() => {
                    onSelect(key)
                    setIsOpen(false)
                  }}
                  onConfig={() => onOpenConfig(key)}
                />
              )
            })}

          {/* Other engines */}
          <div className="px-2 py-1 mt-2 text-[10px] font-semibold uppercase tracking-wider text-[#666980] border-t border-[rgba(255,255,255,0.07)] pt-2 sticky top-0 bg-[#13151f]">
            Pozostałe
          </div>
          {Object.entries(engines)
            .filter(([_, config]) => !config.popular)
            .map(([key, config]) => {
              const colors = getEngineColors(key, config)
              return (
                <EngineOption
                  key={key}
                  engineKey={key}
                  config={config}
                  colors={colors}
                  isSelected={selectedEngine === key}
                  onSelect={() => {
                    onSelect(key)
                    setIsOpen(false)
                  }}
                  onConfig={() => onOpenConfig(key)}
                />
              )
            })}
        </div>
      )}
    </div>
  )
}

interface EngineOptionProps {
  engineKey: string
  config: EngineConfig
  colors: { color: string; bg: string }
  isSelected: boolean
  onSelect: () => void
  onConfig: () => void
}

function EngineOption({ engineKey, config, colors, isSelected, onSelect, onConfig }: EngineOptionProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-[14px] cursor-pointer transition-colors duration-150 ${
        isSelected ? 'bg-[rgba(124,90,240,0.14)]' : 'hover:bg-[#1a1d2a]'
      }`}
      onClick={onSelect}
    >
      <div className={`w-9 h-9 flex-shrink-0 rounded-[10px] flex items-center justify-center text-base ${colors.bg} ${colors.color}`}>
        <i className={`bi ${config.icon}`}></i>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs text-[#dde0ed]">{config.name}</span>
          {config.popular && (
            <span className="text-[8px] bg-[#e8a93a]/20 text-[#e8a93a] px-1.5 py-0.5 rounded-full font-medium">
              POPULARNE
            </span>
          )}
        </div>
        <div className="text-[11px] text-[#666980] mt-0.5 truncate">
          {config.description}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span 
          className={`w-1.5 h-1.5 rounded-full ${config.enabled ? 'bg-[#2dd98f] shadow-[0_0_0_3px_rgba(45,217,143,0.2)]' : 'bg-[#2e3148]'}`} 
          title={config.enabled ? 'Aktywny' : 'Wyłączony'} 
        />
        <i
          className="bi bi-gear text-[#666980] text-sm cursor-pointer hover:text-[#7c5af0] transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onConfig()
          }}
        />
      </div>
    </div>
  )
}
