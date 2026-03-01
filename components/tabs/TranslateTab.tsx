'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslationStore } from '@/lib/store/translationStore'
import { LANGUAGE_NAMES } from '@/lib/config/constants'
import FileUpload from '@/components/ui/FileUpload'
import EngineSelector from '@/components/ui/EngineSelector'
import LanguageSelector from '@/components/ui/LanguageSelector'
import PreviewPanel from '@/components/ui/PreviewPanel'
import ProgressBar from '@/components/ui/ProgressBar'
import SuccessCard from '@/components/ui/SuccessCard'
import ConfigModal from '@/components/modals/ConfigModal'
import TestModal from '@/components/modals/TestModal'
import StatsCards from '@/components/ui/StatsCards'
import toast from 'react-hot-toast'

// Domyślne konfiguracje silników
const DEFAULT_CONFIGS = {
  libretranslate: {
    name: 'LibreTranslate',
    icon: 'bi-globe',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/20',
    description: 'Open source, lokalny serwer',
    server: 'http://localhost:5010',
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
    server: 'http://localhost:11434',
    model: 'llama3.2:latest',
    api_key: '',
    enabled: true,
    popular: true
  },
  deeplx: {
    name: 'DeepLX',
    icon: 'bi-translate',
    iconColor: 'text-pink-400',
    iconBg: 'bg-pink-500/20',
    description: 'Darmowy proxy DeepL',
    server: 'http://localhost:1188',
    token: '',
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
    api_key: '',
    model: 'deepseek-chat',
    enabled: false
  },
  openai: {
    name: 'OpenRouter',
    icon: 'bi-diagram-3',
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/20',
    description: 'OpenRouter API (Llama, GPT, Claude)',
    api_key: '',
    model: 'meta-llama/llama-3.2-3b-instruct:free',
    enabled: false,
    popular: true
  }
} as const

type EngineKey = keyof typeof DEFAULT_CONFIGS

export default function TranslateTab() {
  const {
    currentFileId,
    currentTaskId,
    currentFileBlocks,
    currentOutputFilename,
    sourceLang,
    targetLang,
    setCurrentFileId,
    setCurrentTaskId,
    setCurrentFileBlocks,
    setCurrentOutputFilename,
    setSourceLang,
    setTargetLang,
    incrementTotalTranslations,
    reset: resetState,
  } = useTranslationStore()

  const [selectedEngine, setSelectedEngine] = useState<EngineKey | null>(null)
  const [engines, setEngines] = useState<Record<string, any>>(DEFAULT_CONFIGS)
  const [isUploading, setIsUploading] = useState(false)
  const [fileInfo, setFileInfo] = useState<{
    filename: string
    saved_filename: string
    size: number
    type: string
    detectedLang?: string
  } | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentBlock, setCurrentBlock] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewType, setPreviewType] = useState<'original' | 'translated' | 'sidebyside'>('original')
  const [originalPreview, setOriginalPreview] = useState<string[]>([])
  const [translatedPreview, setTranslatedPreview] = useState<string[]>([])
  const [liveTranslatedBlocks, setLiveTranslatedBlocks] = useState<Map<number, string>>(new Map())
  const [configModal, setConfigModal] = useState<{ isOpen: boolean; engine: string; config: any }>({
    isOpen: false,
    engine: '',
    config: null
  })
  const [testModal, setTestModal] = useState<{
    isOpen: boolean;
    isLoading: boolean;
    result: { success: boolean; message: string } | null;
  }>({
    isOpen: false,
    isLoading: false,
    result: null,
  })
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    loadConfigs()
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/configs')
      const data = await response.json()
      
      // Wymuś ikony z DEFAULT_CONFIGS
      const fixedData = { ...data }
      Object.keys(fixedData).forEach(key => {
        // Sprawdź czy klucz istnieje w DEFAULT_CONFIGS
        if (key in DEFAULT_CONFIGS) {
          const defaultKey = key as EngineKey
          fixedData[key].icon = DEFAULT_CONFIGS[defaultKey].icon
          fixedData[key].iconColor = DEFAULT_CONFIGS[defaultKey].iconColor
          fixedData[key].iconBg = DEFAULT_CONFIGS[defaultKey].iconBg
        }
      })
      
      setEngines(fixedData)
      
      if (!selectedEngine && Object.keys(fixedData).length > 0) {
        setSelectedEngine(Object.keys(fixedData)[0] as EngineKey)
      }
    } catch (error) {
      console.error('Failed to load configs:', error)
      setEngines(DEFAULT_CONFIGS)
      if (!selectedEngine && Object.keys(DEFAULT_CONFIGS).length > 0) {
        setSelectedEngine(Object.keys(DEFAULT_CONFIGS)[0] as EngineKey)
      }
    }
  }

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()

      if (data.success) {
        console.log('Upload response:', data)
        
        setCurrentFileId(data.file_id)
        setCurrentFileBlocks(data.blocks || 0)
        setFileInfo({
          filename: data.filename,
          saved_filename: data.saved_filename,
          size: data.size,
          type: data.file_type,
          detectedLang: data.detected_lang,
        })
        setShowPreview(true)
        setLiveTranslatedBlocks(new Map())

        await loadPreview(data.file_id)

        if (data.detected_lang) {
          setSourceLang(data.detected_lang)
        }
        
        if (data.library_hits?.length) {
          showLibraryHint(data.library_hits)
        }
        
        toast.success(`Plik załadowany: ${data.blocks} bloków, wykryty język: ${LANGUAGE_NAMES[data.detected_lang] || data.detected_lang}`)
      } else {
        toast.error(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const loadPreview = async (fileId: string) => {
    try {
      const response = await fetch(`/api/preview/${fileId}`)
      const data = await response.json()
      if (data.success && data.preview) {
        setOriginalPreview(data.preview)
      }
    } catch (error) {
      console.error('Error loading preview:', error)
    }
  }

  const loadTranslatedPreview = async (taskId: string) => {
    try {
      const response = await fetch(`/api/preview/translated/${taskId}`)
      const data = await response.json()
      if (data.success && data.preview) {
        setTranslatedPreview(data.preview)
        setPreviewType('sidebyside')
      }
    } catch (error) {
      console.error('Error loading translated preview:', error)
    }
  }

  const showLibraryHint = (hits: any[]) => {
    const event = new CustomEvent('library-check', { detail: { hits, single: hits[0] } })
    window.dispatchEvent(event)
  }

  const startTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }
    
    startTimeRef.current = Date.now()
    setElapsedSeconds(0)
    
    timerIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setElapsedSeconds(elapsed)
      }
    }, 1000)
  }

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    startTimeRef.current = null
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startTranslation = async () => {
    if (!currentFileId) {
      toast.error('Najpierw wgraj plik')
      return
    }
    if (!selectedEngine) {
      toast.error('Wybierz silnik AI')
      return
    }
    const config = engines[selectedEngine]
    if (!config.enabled) {
      toast.error('Wybrany silnik jest wyłączony')
      return
    }

    if (!fileInfo || !fileInfo.saved_filename) {
      toast.error('Brak informacji o pliku - wgraj plik ponownie')
      return
    }

    const payload = {
      source_lang: sourceLang,
      target_lang: targetLang,
      engine: selectedEngine,
      file_id: currentFileId,
      saved_filename: fileInfo.saved_filename,
      ...config,
    }

    setIsTranslating(true)
    setShowSuccess(false)
    setProgress(0)
    setCurrentBlock(0)
    setLiveTranslatedBlocks(new Map())
    startTimer()

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const data = await response.json()

      if (data.success) {
        setCurrentTaskId(data.task_id)
        setCurrentOutputFilename(data.output_filename)
        startProgress(data.task_id)
        toast.success('Tłumaczenie rozpoczęte')
      } else {
        toast.error(data.error || 'Nie udało się rozpocząć tłumaczenia')
        resetTranslation()
      }
    } catch (error) {
      console.error('Translation error:', error)
      toast.error('Błąd połączenia z serwerem')
      resetTranslation()
    }
  }

  const startProgress = (taskId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    
    const es = new EventSource(`/api/progress/${taskId}`)
    eventSourceRef.current = es

    es.onopen = () => {
      console.log('EventSource connected')
    }

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)

        if (data.error) {
          toast.error(data.error)
          resetTranslation()
          return
        }

        if (data.progress !== undefined) {
          setProgress(data.progress)
        }
        if (data.current !== undefined) {
          setCurrentBlock(data.current)
        }
        if (data.total !== undefined && data.total > 0) {
          setCurrentFileBlocks(data.total)
        }

        if (data.block_id !== undefined && data.translated_text !== undefined) {
          setLiveTranslatedBlocks(prev => {
            const newMap = new Map(prev)
            newMap.set(data.block_id, data.translated_text)
            return newMap
          })
        }
        
        if (data.completed) {
          es.close()
          eventSourceRef.current = null
          incrementTotalTranslations()
          stopTimer()
          
          setTimeout(() => {
            setIsTranslating(false)
            setShowSuccess(true)
            loadTranslatedPreview(taskId)
            addToHistory()
            toast.success('Tłumaczenie zakończone!')
          }, 500)
        }
      } catch (error) {
        console.error('Error parsing progress message:', error)
      }
    }

    es.onerror = (err) => {
      console.error('EventSource error:', err)
      if (es.readyState === EventSource.CLOSED) {
        toast.error('Połączenie z serwerem zostało przerwane')
        resetTranslation()
      }
    }
  }

  const getLivePreviewData = () => {
    if (previewType === 'original') {
      return originalPreview
    } else if (previewType === 'translated') {
      const translated = Array(originalPreview.length).fill('')
      liveTranslatedBlocks.forEach((text, id) => {
        if (id <= originalPreview.length) {
          translated[id - 1] = text
        }
      })
      return translated
    } else {
      return originalPreview
    }
  }

  const resetTranslation = () => {
    setIsTranslating(false)
    setShowSuccess(false)
    setProgress(0)
    setCurrentBlock(0)
    stopTimer()
    setElapsedSeconds(0)
    setLiveTranslatedBlocks(new Map())
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }

  const resetToUpload = () => {
    resetTranslation()
    resetState()
    setFileInfo(null)
    setShowPreview(false)
    setShowSuccess(false)
    setOriginalPreview([])
    setTranslatedPreview([])
    setLiveTranslatedBlocks(new Map())
    setElapsedSeconds(0)
  }

  const addToHistory = () => {
    const history = JSON.parse(localStorage.getItem('translationHistory') || '[]')
    history.push({
      filename: currentOutputFilename,
      engine: selectedEngine,
      sourceLang,
      targetLang,
      blocks: currentFileBlocks,
      date: new Date().toISOString(),
      downloadUrl: `/download/${currentOutputFilename}`,
    })
    if (history.length > 20) history.shift()
    localStorage.setItem('translationHistory', JSON.stringify(history))
  }

  const handleOpenConfig = (engine: string) => {
    setConfigModal({ 
      isOpen: true, 
      engine, 
      config: engines[engine] 
    })
  }

  const handleSaveConfig = async (engine: string, config: any) => {
    try {
      const response = await fetch(`/api/config/${engine}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await response.json()
      if (data.success) {
        setEngines(prev => ({
          ...prev,
          [engine]: { ...prev[engine], ...config },
        }))
        setConfigModal({ isOpen: false, engine: '', config: null })
        toast.success('Configuration saved')
      } else {
        toast.error('Failed to save configuration')
      }
    } catch (error) {
      toast.error('Failed to save configuration')
    }
  }

  const handleTestEngine = async (engine: string, config: any) => {
    setTestModal({ isOpen: true, isLoading: true, result: null })

    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engine, ...config }),
      })
      const data = await response.json()
      setTestModal({ isOpen: true, isLoading: false, result: data })
    } catch (error: any) {
      setTestModal({
        isOpen: true,
        isLoading: false,
        result: { success: false, message: error.message },
      })
    }
  }

  const getElapsedTimeString = () => {
    return formatTime(elapsedSeconds)
  }

  const estimatedChars = currentFileBlocks * 50
  const estimatedTime = currentFileBlocks * 0.5
  const estimatedTimeString = estimatedTime < 60
    ? `~${Math.round(estimatedTime)}s`
    : `~${Math.floor(estimatedTime / 60)}m ${Math.round(estimatedTime % 60)}s`

  const livePreviewData = getLivePreviewData()
  const liveTranslatedData = Array(originalPreview.length).fill('')
  liveTranslatedBlocks.forEach((text, id) => {
    if (id <= originalPreview.length) {
      liveTranslatedData[id - 1] = text
    }
  })

  return (
    <div className="bg-[#0e1016] border border-[rgba(255,255,255,0.07)] rounded-[28px] p-7">
      {isTranslating && (
        <div className="mb-6">
          <ProgressBar
            progress={progress}
            current={currentBlock}
            total={currentFileBlocks}
            elapsedTime={getElapsedTimeString()}
          />
        </div>
      )}

      {showSuccess && currentOutputFilename && (
        <div className="mb-6">
          <SuccessCard
            blocks={currentFileBlocks}
            elapsedTime={getElapsedTimeString()}
            downloadUrl={`/download/${encodeURIComponent(currentOutputFilename || '')}`}
            onReset={resetToUpload}
          />
        </div>
      )}

      <div className="err-alert hidden" id="errorAlert">
        <i className="bi bi-exclamation-triangle-fill"></i>
        <span></span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-4">
          <FileUpload onUpload={handleUpload} isUploading={isUploading} />

          {fileInfo && (
            <div className="bg-[#13151f] border border-[rgba(255,255,255,0.07)] rounded-[20px] overflow-hidden">
              <div className="p-4 flex items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.07)]">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 flex-shrink-0 bg-gradient-to-r from-[#7c5af0] to-[#9d7ef5] rounded-[14px] flex items-center justify-center text-white text-xl">
                    <i className="bi bi-file-earmark-text"></i>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-[#dde0ed] truncate" title={fileInfo.filename}>
                      {fileInfo.filename}
                    </div>
                    <div className="text-[11px] text-[#666980] font-mono mt-0.5">
                      {(fileInfo.size / 1024).toFixed(1)} KB · {currentFileBlocks} blocks · {fileInfo.type}
                    </div>
                  </div>
                </div>
                {fileInfo.detectedLang && (
                  <div className="bg-[rgba(124,90,240,0.14)] border border-[rgba(124,90,240,0.35)] py-1.5 px-3.5 rounded-full text-xs font-semibold text-[#9d7ef5] whitespace-nowrap flex-shrink-0">
                    <i className="bi bi-translate mr-1"></i>
                    {LANGUAGE_NAMES[fileInfo.detectedLang] || fileInfo.detectedLang}
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-[#0e1016]/50">
                <StatsCards
                  blocks={currentFileBlocks}
                  chars={estimatedChars}
                  estTime={estimatedTimeString}
                />
              </div>
            </div>
          )}

          <EngineSelector
            engines={engines}
            selectedEngine={selectedEngine}
            onSelect={(engine) => setSelectedEngine(engine as EngineKey)}
            onOpenConfig={handleOpenConfig}
          />

          <LanguageSelector
            sourceLang={sourceLang}
            targetLang={targetLang}
            onSourceChange={setSourceLang}
            onTargetChange={setTargetLang}
            detectedLang={fileInfo?.detectedLang}
          />

          <button
            className="w-full bg-gradient-to-r from-[#7c5af0] to-[#9d7ef5] text-white border-none py-4 rounded-[20px] font-bold text-base flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-200 shadow-[0_10px_28px_-8px_rgba(124,90,240,0.55),inset_0_1px_0_rgba(255,255,255,0.15)] disabled:opacity-30 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-8px_rgba(124,90,240,0.7),inset_0_1px_0_rgba(255,255,255,0.2)]"
            onClick={startTranslation}
            disabled={!currentFileId || !selectedEngine || isTranslating}
          >
            <i className="bi bi-play-fill"></i>
            Tłumacz
            <i className="bi bi-arrow-right"></i>
          </button>
        </div>

        <div className="space-y-4">
          {showPreview && (
            <PreviewPanel
              previewData={livePreviewData}
              type={previewType}
              originalData={originalPreview}
              translatedData={isTranslating ? liveTranslatedData : translatedPreview}
              onTypeChange={setPreviewType}
              showToggle={translatedPreview.length > 0 || liveTranslatedBlocks.size > 0}
              isLive={isTranslating}
            />
          )}

          <div className="bg-[#13151f] border border-[rgba(255,255,255,0.07)] rounded-[20px] p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm text-[#dde0ed] flex items-center gap-2">
                <i className="bi bi-lightbulb text-[#e8a93a]"></i>
                Wskazówki
              </h4>
              <i className="bi bi-stars text-[#e8a93a]"></i>
            </div>
            <div className="bg-[#07080d] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-4 max-h-48 overflow-y-auto">
              <div className="py-2 border-b border-[rgba(255,255,255,0.07)] font-mono text-xs text-[#666980] leading-relaxed flex items-start gap-2 last:border-b-0">
                <span className="text-[#7c5af0] font-semibold min-w-[24px] flex-shrink-0">→</span>
                Przeciągnij i upuść SRT / ASS / VTT
              </div>
              <div className="py-2 border-b border-[rgba(255,255,255,0.07)] font-mono text-xs text-[#666980] leading-relaxed flex items-start gap-2 last:border-b-0">
                <span className="text-[#7c5af0] font-semibold min-w-[24px] flex-shrink-0">→</span>
                Automatyczne wykrywanie języka źródłowego
              </div>
              <div className="py-2 border-b border-[rgba(255,255,255,0.07)] font-mono text-xs text-[#666980] leading-relaxed flex items-start gap-2 last:border-b-0">
                <span className="text-[#7c5af0] font-semibold min-w-[24px] flex-shrink-0">→</span>
                11 silników AI — lokalnych i chmurowych
              </div>
              <div className="py-2 border-b border-[rgba(255,255,255,0.07)] font-mono text-xs text-[#666980] leading-relaxed flex items-start gap-2 last:border-b-0">
                <span className="text-[#7c5af0] font-semibold min-w-[24px] flex-shrink-0">→</span>
                <span className="text-green">✨ Podgląd na żywo</span> - tłumaczenia pojawiają się w czasie rzeczywistym
              </div>
              <div className="py-2 font-mono text-xs text-[#666980] leading-relaxed flex items-start gap-2">
                <span className="text-[#7c5af0] font-semibold min-w-[24px] flex-shrink-0">→</span>
                Gotowy plik trafia automatycznie do biblioteki
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfigModal
        isOpen={configModal.isOpen}
        onClose={() => setConfigModal({ isOpen: false, engine: '', config: null })}
        engine={configModal.engine}
        config={configModal.config}
        onSave={handleSaveConfig}
        onTest={handleTestEngine}
      />

      <TestModal
        isOpen={testModal.isOpen}
        onClose={() => setTestModal({ isOpen: false, isLoading: false, result: null })}
        result={testModal.result}
        isLoading={testModal.isLoading}
      />
    </div>
  )
}