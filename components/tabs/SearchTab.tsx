'use client'

import { useState, useEffect } from 'react'
import LibraryResults from '@/components/library/LibraryResults'
import RecentList from '@/components/library/RecentList'
import toast from 'react-hot-toast'

interface LibraryEntry {
  id: number
  norm_title: string
  orig_filename: string
  engine: string
  target_lang: string
  blocks: number
  download_url: string
}

interface RecentEntry {
  id: number
  norm_title: string
  target_lang: string
  engine: string
}

interface OpenSubtitlesResult {
  id: string
  file_id: number
  title: string
  movie_name?: string
  season?: number
  episode?: number
  lang: string
  downloads: number
  uploader?: string
  file_name?: string
  error?: string
}

export default function SearchTab() {
  const [searchTab, setSearchTab] = useState<'local' | 'online'>('local')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLang, setSearchLang] = useState('pl')
  const [results, setResults] = useState<LibraryEntry[]>([])
  const [recent, setRecent] = useState<RecentEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [hasSavedKey, setHasSavedKey] = useState(false)

  useEffect(() => {
    loadRecent()
    loadApiKey()
  }, [])

  const loadRecent = async () => {
    try {
      const response = await fetch('/api/library/recent')
      const data = await response.json()
      if (data.success) {
        setRecent(data.results)
      }
    } catch (error) {
      console.error('Error loading recent:', error)
    }
  }

  const loadApiKey = () => {
    const saved = localStorage.getItem('openSubsApiKey')
    if (saved) {
      setApiKey(saved)
      setHasSavedKey(true)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Wpisz tytuł do wyszukania')
      return
    }

    setIsLoading(true)
    setResults([])

    if (searchTab === 'local') {
      try {
        const response = await fetch(
          `/api/library/search?q=${encodeURIComponent(searchQuery)}&lang=${searchLang}`
        )
        const data = await response.json()
        if (data.success) {
          setResults(data.results)
        }
      } catch (error) {
        toast.error('Błąd wyszukiwania lokalnego')
      }
    } else {
      // OpenSubtitles search
      const keyToUse = apiKey || (hasSavedKey ? localStorage.getItem('openSubsApiKey') : '')
      
      if (!keyToUse) {
        toast.error('Wprowadź klucz API OpenSubtitles')
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/subtitles/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: searchQuery,
            target_lang: searchLang || 'pl',
            api_key: keyToUse,
          }),
        })
        const data = await response.json()
        
        if (data.success) {
          if (data.results && data.results.length > 0 && data.results[0]?.error) {
            setResults([])
            handleOpenSubtitlesError(data.results[0])
          } else {
            setResults(data.results.map((r: OpenSubtitlesResult) => ({
              id: r.file_id,
              norm_title: r.movie_name || r.title || searchQuery,
              orig_filename: r.file_name || '',
              engine: 'OpenSubtitles',
              target_lang: r.lang,
              blocks: 0,
              download_url: `https://www.opensubtitles.com/pl/download/subtitle/${r.file_id}`,
            })))
          }
        }
      } catch (error) {
        toast.error('Błąd połączenia z OpenSubtitles')
      }
    }

    setIsLoading(false)
  }

  const handleOpenSubtitlesError = (error: any) => {
    const isKeyProblem = !hasSavedKey || error.error.includes('JWT') || error.error.includes('cannot consume')
    
    const errorDiv = document.createElement('div')
    errorDiv.className = 'p-5 bg-[rgba(232,169,58,0.06)] border border-[rgba(232,169,58,0.25)] rounded-rl'
    errorDiv.innerHTML = `
      <div class="flex items-start gap-3">
        <i class="bi bi-exclamation-triangle-fill text-gold text-xl flex-shrink-0 mt-0.5"></i>
        <div>
          <div class="text-gold font-bold text-sm mb-1.5">Problem z kluczem API</div>
          <div class="text-muted text-sm leading-relaxed">${error.error}</div>
          ${isKeyProblem ? `
          <div class="mt-3 p-3 bg-surface-3 rounded-r text-xs text-muted leading-relaxed">
            <b class="text-text">Gdzie znaleźć klucz API:</b><br>
            1. Zaloguj się na <a href="https://www.opensubtitles.com" target="_blank" class="text-purple-light">opensubtitles.com</a><br>
            2. Wejdź na <a href="https://www.opensubtitles.com/consumers" target="_blank" class="text-purple-light">opensubtitles.com/consumers</a><br>
            3. Utwórz aplikację i skopiuj klucz (nie zaczyna się od "ey...")
          </div>
          <button onclick="clearApiKey()" class="mt-2.5 bg-red-dim border border-red/30 text-red py-1.5 px-3.5 rounded-r cursor-pointer text-xs">
            <i class="bi bi-arrow-repeat"></i> Wprowadź nowy klucz
          </button>` : ''}
        </div>
      </div>
    `
    
    const container = document.getElementById('searchResults')
    if (container) {
      container.innerHTML = ''
      container.appendChild(errorDiv)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Usunąć ten wpis z biblioteki?')) return

    try {
      await fetch(`/api/library/delete/${id}`, { method: 'DELETE' })
      setResults(prev => prev.filter(r => r.id !== id))
      loadRecent()
      toast.success('Wpis usunięty')
    } catch (error) {
      toast.error('Błąd podczas usuwania')
    }
  }

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error('Wklej klucz API przed zapisaniem')
      return
    }
    localStorage.setItem('openSubsApiKey', apiKey)
    setHasSavedKey(true)
    toast.success('Klucz API zapisany')
  }

  const clearApiKey = () => {
    localStorage.removeItem('openSubsApiKey')
    setApiKey('')
    setHasSavedKey(false)
    toast.success('Klucz API usunięty')
  }

  return (
    <div className="search-inner bg-[#0e1016] border border-[rgba(255,255,255,0.07)] rounded-[28px] p-7">
      {/* Search Bar */}
      <div className="flex gap-2.5 mb-4 flex-wrap">
        <input
          type="text"
          className="flex-1 min-w-[180px] p-3 rounded-[20px] border border-[rgba(255,255,255,0.07)] bg-[#13151f] text-[#dde0ed] text-sm focus:border-[#7c5af0] focus:outline-none"
          placeholder="Szukaj: Star Trek Akademia Gwiezdnej Floty..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <select
          className="p-3 rounded-[20px] border border-[rgba(255,255,255,0.07)] bg-[#13151f] text-[#dde0ed] text-sm cursor-pointer"
          value={searchLang}
          onChange={(e) => setSearchLang(e.target.value)}
        >
          <option value="">Wszystkie języki</option>
          <option value="pl">🇵🇱 Polski</option>
          <option value="en">🇬🇧 Angielski</option>
          <option value="de">🇩🇪 Niemiecki</option>
          <option value="fr">🇫🇷 Francuski</option>
          <option value="es">🇪🇸 Hiszpański</option>
          <option value="it">🇮🇹 Włoski</option>
          <option value="ru">🇷🇺 Rosyjski</option>
        </select>
        <button
          className="bg-gradient-to-r from-[#7c5af0] to-[#9d7ef5] text-white border-none py-3 px-6 rounded-[20px] font-semibold text-sm cursor-pointer whitespace-nowrap hover:opacity-90 disabled:opacity-50"
          onClick={handleSearch}
          disabled={isLoading}
        >
          <i className="bi bi-search"></i> Szukaj
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1.5 mb-4">
        <button
          className={`py-2 px-5 rounded-full border text-sm font-semibold cursor-pointer transition-all ${
            searchTab === 'local' 
              ? 'bg-[rgba(124,90,240,0.14)] border-[rgba(124,90,240,0.4)] text-[#9d7ef5]' 
              : 'border-[rgba(255,255,255,0.07)] text-[#666980] hover:text-[#dde0ed] hover:border-[rgba(255,255,255,0.13)]'
          }`}
          onClick={() => setSearchTab('local')}
        >
          <i className="bi bi-hdd mr-1"></i> Biblioteka lokalna
        </button>
        <button
          className={`py-2 px-5 rounded-full border text-sm font-semibold cursor-pointer transition-all ${
            searchTab === 'online' 
              ? 'bg-[rgba(124,90,240,0.14)] border-[rgba(124,90,240,0.4)] text-[#9d7ef5]' 
              : 'border-[rgba(255,255,255,0.07)] text-[#666980] hover:text-[#dde0ed] hover:border-[rgba(255,255,255,0.13)]'
          }`}
          onClick={() => setSearchTab('online')}
        >
          <i className="bi bi-globe2 mr-1"></i> OpenSubtitles
        </button>
      </div>

      {/* API Key Row (for online) */}
      {searchTab === 'online' && (
        <div className={`mb-4 p-4 rounded-[20px] ${
          hasSavedKey 
            ? 'bg-[rgba(45,217,143,0.13)] border border-[rgba(45,217,143,0.25)]' 
            : 'bg-[rgba(232,169,58,0.06)] border border-[rgba(232,169,58,0.22)]'
        }`}>
          {hasSavedKey ? (
            <div className="flex items-center gap-2.5">
              <i className="bi bi-check-circle-fill text-[#2dd98f] text-lg flex-shrink-0"></i>
              <div className="flex-1">
                <div className="text-[#2dd98f] text-xs font-semibold">Klucz API zapisany ✓</div>
                <div className="text-[11px] text-[#666980]">Przechowywany lokalnie w przeglądarce</div>
              </div>
              <button
                onClick={clearApiKey}
                className="bg-transparent border border-[#ef5858] text-[#ef5858] py-1.5 px-3 rounded-lg text-[11px] cursor-pointer hover:bg-[rgba(239,88,88,0.1)]"
              >
                <i className="bi bi-x"></i> Usuń
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 flex-wrap">
              <i className="bi bi-key-fill text-[#e8a93a] text-base flex-shrink-0"></i>
              <input
                type="password"
                className="flex-1 min-w-[160px] p-2 rounded-[14px] border border-[rgba(255,255,255,0.07)] bg-[#0e1016] text-[#dde0ed] text-xs focus:border-[#7c5af0] focus:outline-none"
                placeholder="Klucz API z opensubtitles.com/consumers"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveApiKey()}
              />
              <button
                className="bg-[#e8a93a] text-[#1a0e00] border-none py-2 px-4 rounded-[14px] font-bold text-xs cursor-pointer hover:bg-[#d97706]"
                onClick={saveApiKey}
              >
                <i className="bi bi-check-lg"></i> Zapisz
              </button>
              <a
                href="https://www.opensubtitles.com/consumers"
                target="_blank"
                className="text-[11px] text-[#e8a93a] no-underline whitespace-nowrap hover:underline"
              >
                <i className="bi bi-box-arrow-up-right"></i> Pobierz klucz
              </a>
            </div>
          )}
          <div className="text-[11px] text-[#666980] mt-2">
            Klucz API jest darmowy. Klucz ≠ JWT token — nie zaczyna się od "ey..."
          </div>
        </div>
      )}

      {/* Results */}
      <div id="searchResults" className="min-h-[200px]">
        {isLoading ? (
          <div className="text-center py-8 text-[#666980]">
            <div className="inline-block w-8 h-8 border-2 border-[#7c5af0] border-t-transparent rounded-full animate-spin mb-3"></div>
            <div className="text-sm">
              {searchTab === 'online' ? 'Odpytuje OpenSubtitles...' : 'Przeszukuję bibliotekę...'}
            </div>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
            {results.map((result) => (
              <div key={result.id} className="bg-[#13151f] border border-[rgba(255,255,255,0.07)] rounded-[20px] p-4 hover:border-[rgba(255,255,255,0.13)] transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-r from-[#7c5af0] to-[#9d7ef5] rounded-[12px] flex items-center justify-center text-white text-base">
                    <i className="bi bi-file-earmark-text"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[#dde0ed] break-words" title={result.norm_title}>
                      {result.norm_title}
                    </div>
                    <div className="text-[11px] text-[#666980] mt-1 font-mono">
                      {result.engine} · {result.target_lang.toUpperCase()} · {result.blocks} bl.
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a 
                    href={result.download_url} 
                    className="flex-1 bg-[#2dd98f] text-[#06100a] text-center py-2 px-3 rounded-[12px] no-underline text-xs font-bold hover:bg-[#24c47e] transition-colors"
                    target={result.engine === 'OpenSubtitles' ? '_blank' : undefined}
                    rel={result.engine === 'OpenSubtitles' ? 'noopener noreferrer' : undefined}
                  >
                    <i className="bi bi-download"></i> Pobierz
                  </a>
                  {result.engine !== 'OpenSubtitles' && (
                    <button
                      className="bg-[rgba(239,88,88,0.13)] border border-[rgba(239,88,88,0.3)] text-[#ef5858] py-2 px-3 rounded-[12px] text-xs cursor-pointer hover:bg-[rgba(239,88,88,0.2)] transition-colors"
                      onClick={() => handleDelete(result.id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-8 text-[#666980]">
            <i className="bi bi-search text-4xl block mb-2 text-[#2e3148]"></i>
            <p>Brak wyników dla "<span className="text-[#dde0ed] font-semibold">{searchQuery}</span>"</p>
            <p className="text-xs mt-2">Spróbuj innego tytułu lub języka</p>
          </div>
        ) : (
          <div className="text-center py-8 text-[#666980]">
            <i className="bi bi-collection text-4xl block mb-2.5 text-[#2e3148]"></i>
            <p>Wpisz tytuł aby wyszukać napisy</p>
          </div>
        )}
      </div>

      {/* Recent */}
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#2e3148] mt-5 mb-3">
        <i className="bi bi-clock-history text-[#7c5af0]"></i>
        <span>Ostatnio przetłumaczone</span>
        <div className="flex-1 h-px bg-[rgba(255,255,255,0.07)]"></div>
      </div>
      
      {recent.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
          {recent.map((entry) => (
            <div
              key={entry.id}
              className="bg-[#13151f] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-3 cursor-pointer hover:border-[rgba(124,90,240,0.28)] transition-colors"
              onClick={() => {
                setSearchQuery(entry.norm_title)
                handleSearch()
              }}
            >
              <div className="font-semibold text-xs text-[#dde0ed] truncate" title={entry.norm_title}>
                {entry.norm_title}
              </div>
              <div className="flex gap-1.5 items-center text-[10px] text-[#666980] mt-1">
                <span className="bg-[rgba(124,90,240,0.14)] text-[#9d7ef5] rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                  {entry.target_lang.toUpperCase()}
                </span>
                <span>{entry.engine}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[#666980] text-xs p-3">
          Brak wpisów w bibliotece
        </div>
      )}
    </div>
  )
}