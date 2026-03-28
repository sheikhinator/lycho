'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { Check, ArrowRight, Copy, MessageCircle } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lycho.vercel.app'

// Isolated component so useSearchParams is inside a Suspense boundary
function RefCapture() {
  const searchParams = useSearchParams()
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) localStorage.setItem('lycho_ref_code', ref.toUpperCase())
  }, [searchParams])
  return null
}

export default function Home() {
  const [email, setEmail]     = useState('')
  const [name, setName]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState<{ position: number; referral_code: string } | null>(null)
  const [copied, setCopied]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const referred_by = localStorage.getItem('lycho_ref_code') ?? undefined

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          referred_by,
        }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Something went wrong. Please try again.')
        return
      }

      if (res.status === 200 && json.message === 'Already on the waitlist') {
        setError('This email is already on the waitlist.')
        return
      }

      // Clear the stored ref after successful use
      localStorage.removeItem('lycho_ref_code')
      setSuccess({ position: json.data.position, referral_code: json.data.referral_code })
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  function getShareUrl(code: string) {
    return `${APP_URL}/?ref=${code}`
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(getShareUrl(code))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleWhatsApp(code: string) {
    const link = getShareUrl(code)
    const msg = encodeURIComponent(
      `I just joined the LYCHO waitlist — the AI platform that runs your business 24/7. Join here: ${link}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: '#070707' }}
    >
      <Suspense fallback={null}>
        <RefCapture />
      </Suspense>

      <div className="w-full max-w-md text-center">

        {/* Logo */}
        <div className="mb-6">
          <Logo size="lg" />
        </div>

        {/* Tagline */}
        <p
          className="font-cormorant tracking-[0.3em] uppercase mb-10"
          style={{
            color: '#C9A84C',
            fontSize: 'clamp(0.65rem, 2vw, 0.85rem)',
            opacity: 0.75,
          }}
        >
          Intelligence. Transmitted.
        </p>

        {success ? (
          /* ── Success state ── */
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: '#141414', border: '1px solid rgba(201,168,76,0.25)' }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(201,168,76,0.12)' }}
            >
              <Check size={22} style={{ color: '#C9A84C' }} />
            </div>

            <p className="font-bebas text-3xl mb-1" style={{ color: '#F0EBE1', letterSpacing: '0.05em' }}>
              You&apos;re #{success.position}
            </p>
            <p className="text-sm font-sans mb-6" style={{ color: '#6b6b6b' }}>
              on the LYCHO waitlist. We&apos;ll be in touch soon.
            </p>

            {/* Share section */}
            <div
              className="rounded-xl p-4 mb-4 text-left"
              style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}
            >
              <p className="text-xs font-sans mb-3" style={{ color: '#6b6b6b' }}>
                Share your link to move up the list:
              </p>

              {/* Link display */}
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3"
                style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
              >
                <span
                  className="flex-1 text-xs font-mono truncate"
                  style={{ color: '#C9A84C' }}
                >
                  {getShareUrl(success.referral_code)}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(success.referral_code)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-sans font-medium transition-colors"
                  style={
                    copied
                      ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
                      : { background: '#1c1c1c', color: '#F0EBE1', border: '1px solid #2a2a2a' }
                  }
                >
                  <Copy size={12} />
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>

                <button
                  onClick={() => handleWhatsApp(success.referral_code)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-sans font-medium transition-opacity hover:opacity-80"
                  style={{ background: '#25D366', color: '#fff' }}
                >
                  <MessageCircle size={12} />
                  WhatsApp
                </button>
              </div>
            </div>

            <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
              Already have an account?{' '}
              <Link href="/login" className="transition-opacity hover:opacity-70" style={{ color: '#C9A84C' }}>
                Sign in
              </Link>
            </p>
          </div>
        ) : (
          /* ── Waitlist form ── */
          <div
            className="rounded-2xl p-8"
            style={{ background: '#141414', border: '1px solid #2a2a2a' }}
          >
            <h2
              className="font-bebas text-2xl mb-1 tracking-wider"
              style={{ color: '#F0EBE1', letterSpacing: '0.05em' }}
            >
              Join the Waitlist
            </h2>
            <p className="text-xs font-sans mb-6" style={{ color: '#6b6b6b' }}>
              The universal AI agent platform for Pakistani and global businesses.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm font-sans outline-none"
                style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1' }}
              />
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg text-sm font-sans outline-none"
                style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1' }}
              />

              {error && (
                <p className="text-xs font-sans text-left" style={{ color: '#ef4444' }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 rounded-lg text-sm font-sans font-medium flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
                style={{ background: '#C9A84C', color: '#070707' }}
              >
                {loading ? 'Joining...' : (
                  <>
                    Request Early Access
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-4">
              <Link
                href="/login"
                className="text-xs font-sans transition-opacity hover:opacity-70"
                style={{ color: '#6b6b6b' }}
              >
                Sign in
              </Link>
              <span style={{ color: '#2a2a2a' }}>·</span>
              <Link
                href="/signup"
                className="text-xs font-sans transition-opacity hover:opacity-70"
                style={{ color: '#6b6b6b' }}
              >
                Create account
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
