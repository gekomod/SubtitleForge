'use client'

import { useState, useEffect } from 'react'

interface LibraryHit {
  id: number
  target_lang: string
  engine: string
  blocks: number
  created_at: number
  download_url: string
}

export default function LibraryBanner() {
  const [show, setShow] = useState(false)
  const [hits, setHits] = useState<LibraryHit[]>([])
  const [singleHit, setSingleHit] = useState<LibraryHit | null>(null)

  useEffect(() => {
    const checkLibrary = async () => {
      // This will be triggered by file upload
      const handleLibraryCheck = (e: CustomEvent) => {
        const { hits: newHits, single } = e.detail
        setHits(newHits)
        setSingleHit(single)
        setShow(true)
      }

      window.addEventListener('library-check' as any, handleLibraryCheck)
      return () => window.removeEventListener('library-check' as any, handleLibraryCheck as any)
    }

    checkLibrary()
  }, [])

  if (!show) return null

  const date = singleHit ? new Date(singleHit.created_at * 1000).toLocaleDateString('pl-PL') : ''

  return (
    <div className="lib-banner show">
      <div className="lib-banner-icon w-13 h-13 bg-gradient-to-br from-green to-[#1aab6d] rounded-r flex items-center justify-center text-2xl flex-shrink-0">
        🎉
      </div>
      
      <div className="flex-1 min-w-[180px]">
        {hits.length > 1 ? (
          <>
            <h5 className="font-bold text-base text-green mb-1">
              Ten tytuł jest już w bibliotece w <span className="text-green">{hits.length} językach</span>!
            </h5>
            <p className="text-sm text-text mb-1">
              Silnik: {singleHit?.engine} · {singleHit?.blocks} bloków · Dodano: {date}
            </p>
            <div className="flex gap-2 flex-wrap mt-2">
              {hits.map(hit => (
                <a
                  key={hit.id}
                  href={hit.download_url}
                  className="bg-[rgba(16,185,129,0.2)] border border-[#10b981] text-[#10b981] py-2 px-4 rounded-[15px] no-underline text-sm font-semibold"
                >
                  <i className="bi bi-download"></i> {hit.target_lang.toUpperCase()}
                </a>
              ))}
            </div>
          </>
        ) : singleHit ? (
          <>
            <h5 className="font-bold text-base text-green mb-1">
              Ten tytuł jest już w bibliotece przetłumaczonych napisów!
            </h5>
            <p className="text-sm text-text">
              Język: {singleHit.target_lang.toUpperCase()} · Silnik: {singleHit.engine} · {singleHit.blocks} bloków · Dodano: {date}
            </p>
          </>
        ) : null}
      </div>

      <div className="lib-banner-btns flex gap-2.5 flex-wrap ml-auto">
        {singleHit && hits.length === 1 && (
          <a href={singleHit.download_url} className="btn-dl py-2.5 px-5">
            <i className="bi bi-download"></i> Pobierz gotowy
          </a>
        )}
        <button
          onClick={() => setShow(false)}
          className="bg-transparent border border-border2 text-muted py-2.5 px-4.5 rounded-full cursor-pointer text-sm"
        >
          <i className="bi bi-x"></i> Tłumacz ponownie
        </button>
      </div>
    </div>
  )
}