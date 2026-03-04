import { useEffect } from 'react'

interface Shortcuts {
  onTab1?: () => void  // 1 — Tłumaczenie
  onTab2?: () => void  // 2 — Szukaj
  onTab3?: () => void  // 3 — Historia
  onEscape?: () => void
}

export function useKeyboardShortcuts({ onTab1, onTab2, onTab3, onEscape }: Shortcuts) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return
      if (e.ctrlKey || e.metaKey || e.altKey) return

      if (e.key === '1' && onTab1) { e.preventDefault(); onTab1() }
      if (e.key === '2' && onTab2) { e.preventDefault(); onTab2() }
      if (e.key === '3' && onTab3) { e.preventDefault(); onTab3() }
      if (e.key === 'Escape' && onEscape) { e.preventDefault(); onEscape() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onTab1, onTab2, onTab3, onEscape])
}
