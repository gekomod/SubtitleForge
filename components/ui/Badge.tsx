'use client'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md'
}

export default function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  const variants = {
    default: 'bg-surface-3 text-muted border-border',
    success: 'bg-green-dim text-green border-green/30',
    warning: 'bg-[rgba(232,169,58,0.1)] text-gold border-gold/30',
    error: 'bg-red-dim text-red border-red/30',
    info: 'bg-purple-dim text-purple-light border-purple/30',
  }

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
  }

  return (
    <span className={`inline-flex items-center rounded-full border ${variants[variant]} ${sizes[size]} font-medium`}>
      {children}
    </span>
  )
}