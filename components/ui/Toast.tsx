'use client'

import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

const VARIANT_STYLES: Record<ToastVariant, { border: string; icon: React.ReactNode }> = {
  success: {
    border: '#4ade80',
    icon: <CheckCircle size={16} style={{ color: '#4ade80' }} />,
  },
  error: {
    border: '#f87171',
    icon: <AlertCircle size={16} style={{ color: '#f87171' }} />,
  },
  warning: {
    border: '#fbbf24',
    icon: <AlertTriangle size={16} style={{ color: '#fbbf24' }} />,
  },
  info: {
    border: '#C9A84C',
    icon: <Info size={16} style={{ color: '#C9A84C' }} />,
  },
}

interface ToastProps {
  toast: ToastItem
  onDismiss: (id: string) => void
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const { border, icon } = VARIANT_STYLES[toast.variant]

  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-lg shadow-xl min-w-[280px] max-w-[380px] pointer-events-auto"
      style={{
        background: '#1c1c1c',
        border: `1px solid ${border}`,
        borderLeft: `3px solid ${border}`,
      }}
      role="alert"
    >
      <span className="shrink-0 mt-0.5">{icon}</span>
      <p className="flex-1 text-sm font-sans leading-snug" style={{ color: '#F0EBE1' }}>
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 transition-colors"
        style={{ color: '#6b6b6b' }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#F0EBE1')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#6b6b6b')}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}
