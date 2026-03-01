'use client'

interface LibraryEntry {
  id: number
  norm_title: string
  orig_filename: string
  engine: string
  target_lang: string
  blocks: number
  download_url: string
}

interface LibraryResultsProps {
  results: LibraryEntry[]
  onDelete: (id: number) => void
}

export default function LibraryResults({ results, onDelete }: LibraryResultsProps) {
  if (!results.length) {
    return (
      <div className="text-center py-8 text-[#666980]">
        <i className="bi bi-search text-3xl block mb-2 text-[#2e3148]"></i>
        Brak wyników w bibliotece lokalnej
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
      {results.map(result => (
        <div key={result.id} className="bg-[#13151f] border border-[rgba(255,255,255,0.07)] rounded-[20px] p-4 hover:border-[rgba(255,255,255,0.13)] transition-colors">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-r from-[#7c5af0] to-[#9d7ef5] rounded-[12px] flex items-center justify-center text-white text-base">
              <i className="bi bi-file-earmark-text"></i>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-[#dde0ed] break-words" title={result.orig_filename}>
                {result.norm_title}
              </div>
              <div className="text-[11px] text-[#666980] mt-1 font-mono">
                {result.engine} · {result.target_lang.toUpperCase()} · {result.blocks} bl.
              </div>
              {result.orig_filename && result.orig_filename !== result.norm_title && (
                <div className="text-[10px] text-[#666980] mt-1 truncate" title={result.orig_filename}>
                  <i className="bi bi-file-earmark-text mr-1"></i>
                  {result.orig_filename}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <a href={result.download_url} className="flex-1 bg-[#2dd98f] text-[#06100a] text-center py-2 px-3 rounded-[12px] no-underline text-xs font-bold hover:bg-[#24c47e] transition-colors">
              <i className="bi bi-download"></i> Pobierz
            </a>
            <button
              className="bg-[rgba(239,88,88,0.13)] border border-[rgba(239,88,88,0.3)] text-[#ef5858] py-2 px-3 rounded-[12px] text-xs cursor-pointer hover:bg-[rgba(239,88,88,0.2)] transition-colors"
              onClick={() => onDelete(result.id)}
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}