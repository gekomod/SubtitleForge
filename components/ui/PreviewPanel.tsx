'use client'

interface PreviewPanelProps {
  previewData: string[]
  type: 'original' | 'translated' | 'sidebyside'
  originalData?: string[]
  translatedData?: string[]
  onTypeChange?: (type: 'original' | 'translated' | 'sidebyside') => void
  showToggle?: boolean
  isLive?: boolean
}

export default function PreviewPanel({
  previewData = [],
  type,
  originalData = [],
  translatedData = [],
  onTypeChange,
  showToggle = false,
  isLive = false,
}: PreviewPanelProps) {
  const renderPreview = () => {
    if (type === 'sidebyside' && originalData.length) {
      const maxLen = Math.max(originalData.length, translatedData.length)
      return (
        <div>
          {Array.from({ length: maxLen }).map((_, i) => {
            const original = originalData[i] || ''
            const translated = translatedData[i] || (isLive ? '⏳ Tłumaczenie...' : '')
            
            return (
              <div
                key={i}
                className="grid grid-cols-2 gap-2.5 py-2.5 border-b border-[rgba(255,255,255,0.07)] last:border-b-0"
              >
                <div className="text-[#94a3b8] text-xs">
                  <span className="text-[#3b82f6] font-semibold mr-1.5">{i + 1}</span>
                  {escapeHtml(original).substring(0, 80)}
                  {original.length > 80 ? '...' : ''}
                </div>
                <div className={`text-xs ${translated ? 'text-[#e2e8f0]' : 'text-[#666980] italic'}`}>
                  {translated ? (
                    <>
                      {escapeHtml(translated).substring(0, 80)}
                      {translated.length > 80 ? '...' : ''}
                    </>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-3 border-2 border-[#7c5af0] border-t-transparent rounded-full animate-spin"></span>
                      Oczekiwanie...
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    const data = type === 'original' ? previewData : translatedData

    return (
      <div>
        {(data || []).length > 0 ? (
          (data || []).slice(0, 10).map((item, i) => (
            <div key={i} className="py-2 border-b border-[rgba(255,255,255,0.07)] font-mono text-xs text-[#666980] leading-relaxed flex items-start gap-2 last:border-b-0">
              <span className="text-[#7c5af0] font-semibold min-w-[24px] flex-shrink-0">{i + 1}</span>
              <span>
                {escapeHtml(item.substring(0, 80))}
                {item.length > 80 ? '...' : ''}
              </span>
            </div>
          ))
        ) : (
          <div className="py-2 font-mono text-xs text-[#666980] leading-relaxed flex items-start gap-2">
            <span className="text-[#7c5af0] font-semibold min-w-[24px] flex-shrink-0">•</span>
            <span>Brak podglądu</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-[#13151f] border border-[rgba(255,255,255,0.07)] rounded-[20px] p-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm text-[#dde0ed] flex items-center gap-2">
          <i className="bi bi-eye text-[#7c5af0] text-base"></i>
          Podgląd
          {isLive && type !== 'original' && (
            <span className="ml-2 text-[10px] bg-green/20 text-green px-2 py-0.5 rounded-full animate-pulse">
              NA ŻYWO
            </span>
          )}
        </h4>
        {showToggle && (
          <div className="flex gap-1.5">
            <button
              className={`text-xs px-2 py-1 rounded transition-colors ${
                type === 'original' 
                  ? 'bg-[rgba(124,90,240,0.14)] text-[#9d7ef5]' 
                  : 'text-[#666980] hover:text-[#dde0ed] hover:bg-[rgba(255,255,255,0.05)]'
              }`}
              onClick={() => onTypeChange?.('original')}
            >
              Oryginał
            </button>
            <button
              className={`text-xs px-2 py-1 rounded transition-colors ${
                type === 'translated' 
                  ? 'bg-[rgba(124,90,240,0.14)] text-[#9d7ef5]' 
                  : 'text-[#666980] hover:text-[#dde0ed] hover:bg-[rgba(255,255,255,0.05)]'
              }`}
              onClick={() => onTypeChange?.('translated')}
            >
              Przetłumaczone
              {isLive && type !== 'translated' && translatedData.some(t => !t) && (
                <span className="ml-1 inline-block w-2 h-2 bg-green rounded-full animate-pulse"></span>
              )}
            </button>
            <button
              className={`text-xs px-2 py-1 rounded transition-colors ${
                type === 'sidebyside' 
                  ? 'bg-[rgba(124,90,240,0.14)] text-[#9d7ef5]' 
                  : 'text-[#666980] hover:text-[#dde0ed] hover:bg-[rgba(255,255,255,0.05)]'
              }`}
              onClick={() => onTypeChange?.('sidebyside')}
            >
              Obok siebie
            </button>
          </div>
        )}
      </div>
      <div className="bg-[#07080d] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-4 max-h-48 overflow-y-auto">
        {renderPreview()}
      </div>
    </div>
  )
}

function escapeHtml(unsafe: string): string {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}