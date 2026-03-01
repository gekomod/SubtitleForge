'use client'

interface StatsCardsProps {
  blocks: number
  chars: number
  estTime: string
}

export default function StatsCards({ blocks, chars, estTime }: StatsCardsProps) {
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Bloki */}
      <div className="bg-[#13151f] border border-[rgba(255,255,255,0.07)] rounded-[12px] p-3 flex items-center gap-2 transition-all duration-200 hover:border-[rgba(124,90,240,0.28)] light-theme:bg-[#f1f5f9] light-theme:border-[rgba(0,0,0,0.08)]">
        <div className="w-8 h-8 bg-[rgba(124,90,240,0.14)] rounded-[8px] flex items-center justify-center flex-shrink-0 light-theme:bg-[rgba(109,74,255,0.1)]">
          <i className="bi bi-grid-3x3-gap-fill text-[#7c5af0] text-sm light-theme:text-[#6d4aff]"></i>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] text-[#666980] uppercase tracking-wider light-theme:text-[#475569]">Bloki</span>
          <span className="text-base font-bold font-mono text-[#dde0ed] leading-tight light-theme:text-[#0f172a]">
            {formatNumber(blocks)}
          </span>
        </div>
      </div>
      
      {/* Znaki */}
      <div className="bg-[#13151f] border border-[rgba(255,255,255,0.07)] rounded-[12px] p-3 flex items-center gap-2 transition-all duration-200 hover:border-[rgba(124,90,240,0.28)] light-theme:bg-[#f1f5f9] light-theme:border-[rgba(0,0,0,0.08)]">
        <div className="w-8 h-8 bg-[rgba(124,90,240,0.14)] rounded-[8px] flex items-center justify-center flex-shrink-0 light-theme:bg-[rgba(109,74,255,0.1)]">
          <i className="bi bi-text-paragraph text-[#7c5af0] text-sm light-theme:text-[#6d4aff]"></i>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] text-[#666980] uppercase tracking-wider light-theme:text-[#475569]">Znaki</span>
          <span className="text-base font-bold font-mono text-[#dde0ed] leading-tight light-theme:text-[#0f172a]">
            {formatNumber(chars)}
          </span>
        </div>
      </div>
      
      {/* Szac. czas */}
      <div className="bg-[#13151f] border border-[rgba(255,255,255,0.07)] rounded-[12px] p-3 flex items-center gap-2 transition-all duration-200 hover:border-[rgba(124,90,240,0.28)] light-theme:bg-[#f1f5f9] light-theme:border-[rgba(0,0,0,0.08)]">
        <div className="w-8 h-8 bg-[rgba(124,90,240,0.14)] rounded-[8px] flex items-center justify-center flex-shrink-0 light-theme:bg-[rgba(109,74,255,0.1)]">
          <i className="bi bi-hourglass-split text-[#7c5af0] text-sm light-theme:text-[#6d4aff]"></i>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] text-[#666980] uppercase tracking-wider light-theme:text-[#475569]">Czas</span>
          <span className="text-base font-bold font-mono text-[#dde0ed] leading-tight light-theme:text-[#0f172a]">
            {estTime}
          </span>
        </div>
      </div>
    </div>
  )
}