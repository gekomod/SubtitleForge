/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#07080d',
        surface: {
          1: '#0e1016',
          2: '#13151f',
          3: '#1a1d2a',
        },
        purple: {
          DEFAULT: '#7c5af0',
          light: '#9d7ef5',
          dim: 'rgba(124,90,240,0.14)',
          dim2: 'rgba(124,90,240,0.28)',
        },
        green: {
          DEFAULT: '#2dd98f',
          dim: 'rgba(45,217,143,0.13)',
        },
        red: {
          DEFAULT: '#ef5858',
          dim: 'rgba(239,88,88,0.13)',
        },
        gold: '#e8a93a',
        text: '#dde0ed',
        muted: '#666980',
        dim: '#2e3148',
        border: 'rgba(255,255,255,0.07)',
        border2: 'rgba(255,255,255,0.13)',
      },
      fontFamily: {
        sans: ['Sora', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'r': '14px',
        'rl': '20px',
        'rxl': '28px',
      },
      animation: {
        'spin-slow': 'spin 1.2s linear infinite',
        'shimmer': 'shimmer 1.8s infinite',
        'pop': 'pop 0.4s cubic-bezier(.34,1.56,.64,1)',
        'fadeIn': 'fadeIn 0.22s ease',
        'dropIn': 'dropIn 0.16s ease',
        'bannerIn': 'bannerIn 0.35s cubic-bezier(.34,1.2,.64,1)',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        pop: {
          '0%': { opacity: 0, transform: 'scale(.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        dropIn: {
          '0%': { opacity: 0, transform: 'translateY(-6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        bannerIn: {
          '0%': { opacity: 0, transform: 'translateY(-8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}