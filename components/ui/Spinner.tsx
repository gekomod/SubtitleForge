'use client'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

export default function Spinner({ size = 'md', color = 'text-purple' }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  }

  return (
    <div className={`${sizes[size]} ${color} border-t-transparent rounded-full animate-spin`}></div>
  )
}