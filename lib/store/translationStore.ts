import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TranslationState {
  // Current translation
  currentFileId: string | null
  currentTaskId: string | null
  currentFileBlocks: number
  currentOutputFilename: string | null
  currentPreviewFileId: string | null
  
  // Progress
  progress: number
  currentBlock: number
  status: 'idle' | 'uploading' | 'translating' | 'completed' | 'error'
  error: string | null
  
  // Preview
  originalPreview: string[]
  translatedPreview: string[]
  
  // Settings
  sourceLang: string
  targetLang: string
  selectedEngine: string | null
  
  // Stats
  totalTranslations: number
  
  // Actions
  setCurrentFileId: (id: string | null) => void
  setCurrentTaskId: (id: string | null) => void
  setCurrentFileBlocks: (blocks: number) => void
  setCurrentOutputFilename: (filename: string | null) => void
  setCurrentPreviewFileId: (id: string | null) => void
  setProgress: (progress: number) => void
  setCurrentBlock: (block: number) => void
  setStatus: (status: TranslationState['status']) => void
  setError: (error: string | null) => void
  setOriginalPreview: (preview: string[]) => void
  setTranslatedPreview: (preview: string[]) => void
  setSourceLang: (lang: string) => void
  setTargetLang: (lang: string) => void
  setSelectedEngine: (engine: string | null) => void
  incrementTotalTranslations: () => void
  loadTotalTranslations: () => void
  reset: () => void
}

export const useTranslationStore = create<TranslationState>()(
  persist(
    (set, get) => ({
      currentFileId: null,
      currentTaskId: null,
      currentFileBlocks: 0,
      currentOutputFilename: null,
      currentPreviewFileId: null,
      progress: 0,
      currentBlock: 0,
      status: 'idle',
      error: null,
      originalPreview: [],
      translatedPreview: [],
      sourceLang: 'auto',
      targetLang: 'pl',
      selectedEngine: null,
      totalTranslations: 0,

      setCurrentFileId: (id) => set({ currentFileId: id }),
      setCurrentTaskId: (id) => set({ currentTaskId: id }),
      setCurrentFileBlocks: (blocks) => set({ currentFileBlocks: blocks }),
      setCurrentOutputFilename: (filename) => set({ currentOutputFilename: filename }),
      setCurrentPreviewFileId: (id) => set({ currentPreviewFileId: id }),
      setProgress: (progress) => set({ progress }),
      setCurrentBlock: (block) => set({ currentBlock: block }),
      setStatus: (status) => set({ status }),
      setError: (error) => set({ error }),
      setOriginalPreview: (preview) => set({ originalPreview: preview }),
      setTranslatedPreview: (preview) => set({ translatedPreview: preview }),
      setSourceLang: (lang) => set({ sourceLang: lang }),
      setTargetLang: (lang) => set({ targetLang: lang }),
      setSelectedEngine: (engine) => set({ selectedEngine: engine }),
      
      incrementTotalTranslations: () => {
        const newTotal = get().totalTranslations + 1
        localStorage.setItem('totalTranslations', newTotal.toString())
        set({ totalTranslations: newTotal })
      },
      
      loadTotalTranslations: () => {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('totalTranslations')
          if (stored) {
            set({ totalTranslations: parseInt(stored, 10) })
          }
        }
      },
      
      reset: () => set({
        currentFileId: null,
        currentTaskId: null,
        currentFileBlocks: 0,
        currentOutputFilename: null,
        currentPreviewFileId: null,
        progress: 0,
        currentBlock: 0,
        status: 'idle',
        error: null,
        originalPreview: [],
        translatedPreview: [],
      }),
    }),
    {
      name: 'translation-storage',
      partialize: (state) => ({
        sourceLang: state.sourceLang,
        targetLang: state.targetLang,
        selectedEngine: state.selectedEngine,
        totalTranslations: state.totalTranslations,
      }),
    }
  )
)