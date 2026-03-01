'use client'

import { useEffect, useState } from 'react'

interface AlertProps {
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
  onClose?: () => void
}

export default function Alert({ type, message, duration = 5000, onClose }: AlertProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  if (!isVisible) return null

  const styles = {
    success: 'bg-green-dim border-green text-green',
    error: 'bg-red-dim border-red text-red',
    info: 'bg-purple-dim border-purple text-purple-light',
    warning: 'bg-[rgba(232,169,58,0.1)] border-gold text-gold',
  }

  const icons = {
    success: 'bi-check-circle-fill',
    error: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill',
    warning: 'bi-exclamation-circle-fill',
  }

  return (
    <div className={`${styles[type]} border-l-3 p-3 rounded-r flex items-center gap-2.5 text-sm animate-fadeIn`}>
      <i className={`bi ${icons[type]} text-base`}></i>
      <span className="flex-1">{message}</span>
      <button onClick={() => { setIsVisible(false); onClose?.(); }} className="text-current opacity-60 hover:opacity-100">
        <i className="bi bi-x"></i>
      </button>
    </div>
  )
}