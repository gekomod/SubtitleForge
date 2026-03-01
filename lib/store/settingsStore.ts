import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  // UI
  theme: 'dark' | 'light'
  compactMode: boolean
  
  // Defaults
  defaultSourceLang: string
  defaultTargetLang: string
  defaultEngine: string | null
  
  // API Keys
  openSubsApiKey: string | null
  
  // Actions
  setTheme: (theme: 'dark' | 'light') => void
  setCompactMode: (compact: boolean) => void
  setDefaultSourceLang: (lang: string) => void
  setDefaultTargetLang: (lang: string) => void
  setDefaultEngine: (engine: string | null) => void
  setOpenSubsApiKey: (key: string | null) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      compactMode: false,
      defaultSourceLang: 'auto',
      defaultTargetLang: 'pl',
      defaultEngine: null,
      openSubsApiKey: null,

      setTheme: (theme) => {
        if (typeof window !== 'undefined') {
          if (theme === 'light') {
            document.body.classList.add('light-theme')
          } else {
            document.body.classList.remove('light-theme')
          }
        }
        set({ theme })
      },

      setCompactMode: (compact) => set({ compactMode: compact }),
      setDefaultSourceLang: (lang) => set({ defaultSourceLang: lang }),
      setDefaultTargetLang: (lang) => set({ defaultTargetLang: lang }),
      setDefaultEngine: (engine) => set({ defaultEngine: engine }),
      setOpenSubsApiKey: (key) => set({ openSubsApiKey: key }),

      reset: () => set({
        theme: 'dark',
        compactMode: false,
        defaultSourceLang: 'auto',
        defaultTargetLang: 'pl',
        defaultEngine: null,
        openSubsApiKey: null,
      }),
    }),
    {
      name: 'settings-storage',
    }
  )
)