'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface HistoryItem {
  filename: string
  engine: string
  sourceLang: string
  targetLang: string
  blocks: number
  date: string
  downloadUrl?: string
}

export default function HistoryTab() {
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = () => {
    const stored = localStorage.getItem('translationHistory')
    if (stored) {
      setHistory(JSON.parse(stored).reverse())
    }
  }

  const clearHistory = () => {
    if (!confirm('Wyczyścić historię?')) return
    localStorage.removeItem('translationHistory')
    setHistory([])
    toast.success('Historia wyczyszczona')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (history.length === 0) {
    return (
      <div className="search-inner bg-surface-1 border border-border rounded-rxl p-7">
        <div className="text-center py-12 text-muted">
          <i className="bi bi-clock-history text-5xl block mb-3 text-dim"></i>
          <p className="text-sm">Brak historii w tej sesji</p>
        </div>
      </div>
    )
  }

  return (
    <div className="search-inner bg-surface-1 border border-border rounded-rxl p-7">
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-base font-bold flex items-center gap-2">
          <i className="bi bi-clock-history text-purple"></i>
          Historia sesji
        </h4>
        <button
          onClick={clearHistory}
          className="btn btn-sm border border-red text-red py-1.5 px-4 rounded-full text-xs font-semibold bg-transparent hover:bg-red-dim"
        >
          <i className="bi bi-trash"></i> Wyczyść
        </button>
      </div>

      <div className="history-grid grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
        {history.map((item, index) => (
          <div
            key={index}
            className="bg-surface-2 border border-border rounded-rl p-4"
          >
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-9 h-9 bg-gradient-to-r from-purple to-purple-light rounded-r flex items-center justify-center text-white text-base flex-shrink-0">
                <i className="bi bi-file-earmark-text"></i>
              </div>
              <div className="overflow-hidden min-w-0">
                <div
                  className="text-text font-semibold text-xs truncate"
                  title={item.filename}
                >
                  {item.filename}
                </div>
                <div className="text-muted text-[11px] font-mono">
                  {item.engine} · {item.sourceLang}→{item.targetLang} · {item.blocks} bloków
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dim text-[11px] font-mono">
                {formatDate(item.date)}
              </span>
              {item.downloadUrl && (
                <a
                  href={item.downloadUrl}
                  className="btn-res-dl bg-green text-[#06100a] py-1.5 px-3 rounded-lg text-[11px] font-bold no-underline"
                >
                  <i className="bi bi-download"></i> Pobierz
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}