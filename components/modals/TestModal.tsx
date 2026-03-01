'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface TestModalProps {
  isOpen: boolean
  onClose: () => void
  result?: {
    success: boolean
    message: string
  } | null
  isLoading: boolean
}

export default function TestModal({ isOpen, onClose, result, isLoading }: TestModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="modal-content relative bg-surface-2 rounded-rxl border border-border2 text-text w-full max-w-sm mx-4">
        <div className="modal-body text-center py-4 px-6">
          {isLoading ? (
            <>
              <div className="spinner-border text-purple mb-3 w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-muted">Testowanie połączenia...</p>
            </>
          ) : result ? (
            <>
              <i className={`bi ${result.success ? 'bi-check-circle-fill text-green' : 'bi-exclamation-triangle-fill text-red'} text-5xl block mb-3`}></i>
              <p className={`mt-3 font-semibold text-sm whitespace-pre-wrap ${result.success ? 'text-green' : 'text-red'}`}>
                {result.message}
              </p>
              <button
                className="btn btn-sm btn-outline-primary mt-3 px-4 py-2 border border-purple text-purple rounded-r text-sm hover:bg-purple-dim"
                onClick={onClose}
              >
                Close
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  )
}