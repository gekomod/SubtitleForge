import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface HistoryItem {
  id: string
  filename: string
  engine: string
  sourceLang: string
  targetLang: string
  blocks: number
  date: string
  downloadUrl?: string
}

interface HistoryState {
  items: HistoryItem[]
  addItem: (item: Omit<HistoryItem, 'id' | 'date'>) => void
  removeItem: (id: string) => void
  clearAll: () => void
  getStats: () => { total: number; byEngine: Record<string, number> }
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const newItem: HistoryItem = {
          ...item,
          id: Date.now().toString(36) + Math.random().toString(36).substring(2),
          date: new Date().toISOString(),
        }
        
        set((state) => ({
          items: [newItem, ...state.items].slice(0, 50),
        }))
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }))
      },

      clearAll: () => set({ items: [] }),

      getStats: () => {
        const items = get().items
        const byEngine: Record<string, number> = {}
        
        items.forEach((item) => {
          byEngine[item.engine] = (byEngine[item.engine] || 0) + 1
        })
        
        return {
          total: items.length,
          byEngine,
        }
      },
    }),
    {
      name: 'history-storage',
    }
  )
)