'use client'

interface DetailedStatsProps {
  blocks: number
  chars: number
  estTime: string
  avgBlockLength?: number
  estimatedTokens?: number
}

export default function DetailedStats({ 
  blocks, 
  chars, 
  estTime,
  avgBlockLength,
  estimatedTokens 
}: DetailedStatsProps) {
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  const avgLength = avgBlockLength || Math.round(chars / blocks)
  const tokens = estimatedTokens || Math.round(chars / 4) // Przybliżenie: 1 token ≈ 4 znaki

  return (
    <div className="bg-[#13151f] border border-[rgba(255,255,255,0.07)] rounded-[20px] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-[rgba(124,90,240,0.14)] rounded-[10px] flex items-center justify-center">
          <i className="bi bi-bar-chart-fill text-[#7c5af0] text-sm"></i>
        </div>
        <h4 className="font-semibold text-sm text-[#dde0ed]">Szczegółowe statystyki</h4>
      </div>

      <div className="space-y-3">
        {/* Główne statystyki */}
        <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.07)]">
          <span className="text-xs text-[#666980]">Liczba bloków</span>
          <span className="text-sm font-mono text-[#dde0ed] font-semibold">{formatNumber(blocks)}</span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.07)]">
          <span className="text-xs text-[#666980]">Łączna liczba znaków</span>
          <span className="text-sm font-mono text-[#dde0ed] font-semibold">{formatNumber(chars)}</span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.07)]">
          <span className="text-xs text-[#666980]">Średnia długość bloku</span>
          <span className="text-sm font-mono text-[#dde0ed] font-semibold">{formatNumber(avgLength)} znaków</span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.07)]">
          <span className="text-xs text-[#666980]">Szacowana liczba tokenów</span>
          <span className="text-sm font-mono text-[#dde0ed] font-semibold">{formatNumber(tokens)}</span>
        </div>

        <div className="flex justify-between items-center py-2">
          <span className="text-xs text-[#666980]">Szacowany czas tłumaczenia</span>
          <span className="text-sm font-mono text-[#dde0ed] font-semibold">{estTime}</span>
        </div>
      </div>

      {/* Wskaźnik postępu dla oszacowania */}
      <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.07)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-[#666980] uppercase tracking-wider">Postęp tłumaczenia</span>
          <span className="text-[10px] font-mono text-[#7c5af0]">0/914</span>
        </div>
        <div className="h-1 bg-[#1a1d2a] rounded-full overflow-hidden">
          <div className="h-full w-0 bg-gradient-to-r from-[#7c5af0] to-[#9d7ef5] rounded-full"></div>
        </div>
      </div>
    </div>
  )
}