import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

export const metadata: Metadata = {
  title: 'SubtitleForge • AI Translation Studio',
  description: 'Cinema-grade AI subtitle translation · 11 AI engines · SRT ASS VTT',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--s3)',
                color: 'var(--text)',
                border: '1px solid var(--border2)',
                borderRadius: '14px',
                fontFamily: "'Syne', sans-serif",
                fontSize: '13px',
              },
              success: { iconTheme: { primary: 'var(--green)', secondary: 'var(--gdim)' } },
              error:   { iconTheme: { primary: 'var(--red)',   secondary: 'var(--rdim)' } },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
