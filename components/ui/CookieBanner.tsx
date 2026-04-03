'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export default function CookieBanner() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lycho_cookies_accepted') === 'true'
    }
    return false
  })

  if (dismissed) return null

  function handleAccept() {
    localStorage.setItem('lycho_cookies_accepted', 'true')
    setDismissed(true)
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      style={{ background: 'rgba(7,7,7,0.97)', borderTop: '1px solid #2a2a2a', backdropFilter: 'blur(12px)' }}
    >
      <div className="max-w-4xl mx-auto flex items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-sans" style={{ color: '#F0EBE1' }}>
            We use essential cookies for authentication and session management. No third-party tracking.
          </p>
          <p className="text-xs font-sans mt-1" style={{ color: '#6b6b6b' }}>
            By continuing, you agree to our <a href="/privacy" style={{ color: '#C9A84C' }}>Privacy Policy</a> and <a href="/terms" style={{ color: '#C9A84C' }}>Terms of Service</a>.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleAccept}
            className="text-xs font-sans px-4 py-2 rounded transition-colors"
            style={{ background: '#C9A84C', color: '#070707', fontWeight: '600' }}
          >
            Accept
          </button>
          <button
            onClick={handleAccept}
            className="p-1 rounded transition-colors"
            style={{ color: '#6b6b6b' }}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
