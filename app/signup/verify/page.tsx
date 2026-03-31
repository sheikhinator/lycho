'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, RefreshCw } from 'lucide-react'

function VerifyContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleResend() {
    if (!email) return
    setSending(true)
    setError(null)
    setSent(false)
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to resend.'); return }
      setSent(true)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-deep border border-border rounded-xl p-10">
      <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-6">
        <Mail size={24} className="text-gold" />
      </div>

      <h2 className="font-cormorant text-2xl text-ivory font-medium mb-3">
        Check your email
      </h2>

      <p className="text-sm text-muted leading-relaxed mb-2">
        We sent a confirmation email to
      </p>
      {email && (
        <p className="text-sm text-gold font-medium mb-4 break-all">{email}</p>
      )}

      <p className="text-sm text-muted leading-relaxed mb-2">
        Check your <strong className="text-ivory">inbox and spam folder</strong>.
        The email comes from <strong className="text-ivory">onboarding@resend.dev</strong>.
      </p>
      <p className="text-xs text-muted mb-6">
        Click the confirmation link to activate your LYCHO account.
      </p>

      <div className="mt-6 pt-6 border-t border-border space-y-3">
        <p className="text-xs text-muted">Didn&apos;t receive the email?</p>

        {sent && (
          <p className="text-xs text-green-400">Verification email resent — check your inbox.</p>
        )}
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        {email && (
          <button
            onClick={handleResend}
            disabled={sending}
            className="inline-flex items-center gap-2 text-xs text-gold hover:text-pulse transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={sending ? 'animate-spin' : ''} />
            {sending ? 'Sending...' : 'Resend verification email'}
          </button>
        )}

        <p className="text-xs text-muted">
          or{' '}
          <Link href="/signup" className="text-gold hover:text-pulse transition-colors">
            try signing up again
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  useEffect(() => { document.title = 'Check Your Email — LYCHO' }, [])

  return (
    <main className="min-h-screen bg-void flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="font-bebas text-5xl tracking-[0.2em] text-gold mb-10">LYCHO</h1>
        <Suspense fallback={<div className="text-muted text-sm">Loading...</div>}>
          <VerifyContent />
        </Suspense>
      </div>
    </main>
  )
}
