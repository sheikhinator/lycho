'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Input } from '@/components/ui'
import { createClientSupabase } from '@/lib/supabase'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClientSupabase()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-void flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Wordmark */}
        <div className="text-center mb-10">
          <h1 className="font-bebas text-5xl tracking-[0.2em] text-gold">LYCHO</h1>
        </div>

        <div className="bg-deep border border-border rounded-xl p-8">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={36} className="text-green-400 mx-auto mb-4" />
              <h2 className="font-cormorant text-xl text-ivory font-medium mb-2">
                Reset link sent
              </h2>
              <p className="text-sm text-muted leading-relaxed mb-6">
                Check <span className="text-gold">{email}</span> for a link to reset your password.
              </p>
              <Link href="/login" className="text-sm text-gold hover:text-pulse transition-colors">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-cormorant text-2xl text-ivory font-medium mb-2">
                Forgot password?
              </h2>
              <p className="text-sm text-muted mb-6">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />

                {error && (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-gold transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
