'use client'

interface ProgressBarProps {
  progress: number
  current: number
  total: number
  elapsedTime: string
}

export default function ProgressBar({ progress, current, total, elapsedTime }: ProgressBarProps) {
  // Zabezpieczenie przed dzieleniem przez zero
  const safeProgress = Math.min(100, Math.max(0, progress))
  const safeCurrent = current || 0
  const safeTotal = total || 0

  return (
    <div className="bg-[#13151f] border border-[rgba(124,90,240,0.28)] rounded-[20px] p-6 shadow-[0_0_40px_-20px_#7c5af0]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5 font-semibold text-sm">
          <i className="bi bi-arrow-repeat text-[#7c5af0] animate-spin"></i>
          <span className="text-[#dde0ed]">Tłumaczenie w toku...</span>
        </div>
        <span className="font-mono text-2xl font-bold text-[#7c5af0]">{safeProgress}%</span>
      </div>

      <div className="h-1 bg-[#1a1d2a] rounded overflow-hidden mb-3">
        <div 
          className="h-full bg-gradient-to-r from-[#7c5af0] via-[#9d7ef5] to-[#e8a93a] rounded relative transition-all duration-300"
          style={{ width: `${safeProgress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1 font-mono">
          <span className="text-xl font-bold text-[#7c5af0]">{safeCurrent}</span>
          <span className="text-base text-[#666980]">/</span>
          <span className="text-base text-[#666980]">{safeTotal}</span>
          <span className="text-[11px] text-[#666980] ml-1">bloków</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[#666980] text-sm">
          <i className="bi bi-stopwatch text-[#7c5af0]"></i>
          <span>{elapsedTime}</span>
        </div>
      </div>
    </div>
  )
}