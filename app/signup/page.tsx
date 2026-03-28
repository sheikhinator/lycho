'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input } from '@/components/ui'

const SECTORS = [
  'E-commerce', 'Healthcare', 'Education', 'Finance & Banking',
  'Real Estate', 'Food & Beverage', 'Logistics', 'IT Services',
  'Retail', 'Travel & Hospitality', 'Manufacturing', 'Other',
]

const COUNTRIES = [
  { code: 'PK', name: 'Pakistan' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IN', name: 'India' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
]

const selectClass =
  'bg-deep border border-border rounded px-3 py-2 text-sm text-ivory outline-none ' +
  'focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all appearance-none'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    businessName: '',
    email: '',
    password: '',
    phone: '',
    sector: '',
    country: 'PK',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      router.push(`/signup/verify?email=${encodeURIComponent(form.email)}`)
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-void flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Wordmark */}
        <div className="text-center mb-10">
          <h1 className="font-bebas text-5xl tracking-[0.2em] text-gold">LYCHO</h1>
          <p className="font-cormorant text-ivory/50 mt-1 tracking-[0.25em] text-sm uppercase">
            Intelligence. Transmitted.
          </p>
        </div>

        {/* Card */}
        <div className="bg-deep border border-border rounded-xl p-8">
          <h2 className="font-cormorant text-2xl text-ivory font-medium mb-1">
            Create your account
          </h2>
          <p className="text-xs text-muted mb-6">14-day free trial · No credit card required</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Business Name"
              name="businessName"
              placeholder="Acme Corp"
              value={form.businessName}
              onChange={handleChange}
              required
              autoComplete="organization"
            />
            <Input
              label="Business Email"
              name="email"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="+92 300 0000000"
              value={form.phone}
              onChange={handleChange}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted uppercase tracking-widest">Sector</label>
              <select name="sector" value={form.sector} onChange={handleChange} className={selectClass}>
                <option value="">Select your sector</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted uppercase tracking-widest">Country</label>
              <select name="country" value={form.country} onChange={handleChange} className={selectClass}>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-gold hover:text-pulse transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted/60">
          By signing up you agree to LYCHO's terms of service.
        </p>
      </div>
    </main>
  )
}
