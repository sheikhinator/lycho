'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { Check, ArrowRight } from 'lucide-react'

export default function Home() {
  const [email, setEmail]       = useState('')
  const [name, setName]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState<{ position: number; referral_code: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
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

      setSuccess({ position: json.data.position, referral_code: json.data.referral_code })
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: '#070707' }}
    >
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
          /* Success state */
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
            <p className="text-sm font-sans mb-5" style={{ color: '#6b6b6b' }}>
              on the LYCHO waitlist. We&apos;ll be in touch soon.
            </p>
            <div
              className="rounded-lg px-4 py-3 mb-5"
              style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.15)' }}
            >
              <p className="text-xs font-sans mb-1" style={{ color: '#6b6b6b' }}>Your referral code</p>
              <p className="font-mono text-base font-semibold" style={{ color: '#C9A84C' }}>{success.referral_code}</p>
              <p className="text-xs font-sans mt-1" style={{ color: '#6b6b6b' }}>Share to move up the list</p>
            </div>
            <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
              Already have an account?{' '}
              <Link href="/login" className="transition-opacity hover:opacity-70" style={{ color: '#C9A84C' }}>
                Sign in
              </Link>
            </p>
          </div>
        ) : (
          /* Waitlist form */
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
