'use client'
export default function Footer() {
  return (
    <footer className="text-center mt-10 pb-2">
      <div className="flex items-center justify-center gap-2 mb-1.5">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--border2)]"></div>
        <i className="bi bi-film text-[var(--dim)] text-xs"></i>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--border2)]"></div>
      </div>
      <p className="font-mono text-[10px] text-[var(--muted)] tracking-wider">
        SUBTITLEFORGE © 2025 · AI Subtitle Translation Studio
      </p>
      <p className="font-mono text-[9px] text-[var(--dim)] mt-0.5">
        Space Grotesk · Fira Code · Bebas Neue
      </p>
    </footer>
  )
}
