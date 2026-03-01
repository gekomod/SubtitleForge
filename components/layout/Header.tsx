'use client'

interface HeaderProps {
  totalTranslations: number
}

export default function Header({ totalTranslations }: HeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
      <div className="flex items-center gap-4">
        <div className="w-[52px] h-[52px] bg-gradient-to-r from-purple to-purple-light rounded-r flex items-center justify-center text-2xl text-white shadow-[0_6px_24px_-6px_rgba(124,90,240,0.6),inset_0_1px_0_rgba(255,255,255,0.18)]">
          <i className="bi bi-translate"></i>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text leading-tight">
            Subtitle<span className="text-purple-light">Forge</span>
          </h1>
          <p className="text-xs text-muted mt-0.5">Cinema-grade AI subtitle translation</p>
        </div>
      </div>
      
      <div className="bg-surface-2 border border-border py-2 px-4.5 rounded-full text-xs text-muted flex items-center gap-2">
        <i className="bi bi-clock-history text-purple"></i>
        <span>{totalTranslations} tłumaczeń</span>
      </div>
    </div>
  )
}