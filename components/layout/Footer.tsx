'use client'

import { useTheme } from '@/components/providers/ThemeProvider'
import { useEffect, useState } from 'react'

export default function Footer() {
  const [mounted, setMounted] = useState(false)
  // HOOKI MUSZĄ BYĆ WYWOŁYWANE W TEJ SAMEJ KOLEJNOŚCI ZAWSZE!
  // Dlatego useTheme musi być przed warunkowym returnem
  const themeContext = useTheme() // To zawsze będzie wywołane
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // Teraz możemy bezpiecznie użyć themeContext tylko gdy mounted
  if (!mounted) {
    return (
      <div className="text-center mt-10 text-xs text-[#666980]">
        <p>© 2025 SubtitleForge</p>
      </div>
    )
  }

  const { theme, toggleTheme } = themeContext
  
  return (
    <div className="text-center mt-10 text-xs text-[#666980]">
      <p>
        © 2025 SubtitleForge &nbsp;·&nbsp;
        <button 
          onClick={toggleTheme} 
          className="text-[#9d7ef5] hover:underline bg-transparent border-none cursor-pointer inline-flex items-center gap-1"
        >
          <i className={`bi ${theme === 'dark' ? 'bi-moon-stars-fill' : 'bi-sun-fill'}`}></i>
          {theme === 'dark' ? 'Ciemny' : 'Jasny'}
        </button>
      </p>
    </div>
  )
}