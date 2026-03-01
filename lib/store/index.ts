// Re-export wszystkie store z jednego miejsca
export * from './translationStore'
export * from './historyStore'
export * from './settingsStore'

// Dla zachowania kompatybilności, eksportujemy też domyślny store
import { useTranslationStore } from './translationStore'
export const useStore = useTranslationStore