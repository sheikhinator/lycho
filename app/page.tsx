'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { Check, ArrowRight, Copy, MessageCircle, Menu, X } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lycho.vercel.app'

// ─── Ref capture (needs Suspense) ─────────────────────────────────────────────
function RefCapture() {
  const searchParams = useSearchParams()
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) localStorage.setItem('lycho_ref_code', ref.toUpperCase())
  }, [searchParams])
  return null
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const links = [
    { href: '#features',    label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#pricing',     label: 'Pricing' },
    { href: '#agents',      label: 'Agents' },
  ]

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(7,7,7,0.97)' : '#070707',
        borderBottom: `1px solid ${scrolled ? '#2a2a2a' : 'transparent'}`,
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-5 lg:px-10 flex items-center justify-between h-16">
        <Link href="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Logo size="sm" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-sans transition-colors"
              style={{ color: '#6b6b6b' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#F0EBE1')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#6b6b6b')}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-sans px-4 py-2 rounded-lg transition-colors"
            style={{ color: '#6b6b6b', border: '1px solid #2a2a2a' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F0EBE1'; (e.currentTarget as HTMLElement).style.borderColor = '#6b6b6b' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6b6b6b'; (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a' }}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-sm font-sans font-medium px-5 py-2 rounded-lg transition-opacity hover:opacity-85"
            style={{ background: '#C9A84C', color: '#070707' }}
          >
            Start 7-Day Trial — PKR 999
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          style={{ color: '#F0EBE1' }}
          onClick={() => setOpen(v => !v)}
          aria-label="Menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden px-5 pb-5 space-y-3"
          style={{ background: '#0d0d0d', borderTop: '1px solid #2a2a2a' }}
        >
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              className="block text-sm font-sans py-2"
              style={{ color: '#6b6b6b' }}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2">
            <Link href="/login" className="text-sm font-sans py-2.5 text-center rounded-lg" style={{ color: '#6b6b6b', border: '1px solid #2a2a2a' }} onClick={() => setOpen(false)}>Sign In</Link>
            <Link href="/signup" className="text-sm font-sans font-medium py-2.5 text-center rounded-lg" style={{ background: '#C9A84C', color: '#070707' }} onClick={() => setOpen(false)}>Start 7-Day Trial — PKR 999</Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Waitlist section (extracted for Suspense) ────────────────────────────────
function WaitlistSection() {
  const [email, setEmail]     = useState('')
  const [name, setName]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState<{ position: number; referral_code: string } | null>(null)
  const [copied, setCopied]   = useState(false)
  const [leaderboard, setLeaderboard] = useState<{ position: number; referral_count: number }[]>([])

  function getShareUrl(code: string) { return `${APP_URL}/?ref=${code}` }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const referred_by = localStorage.getItem('lycho_ref_code') ?? undefined
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined, referred_by }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Something went wrong.'); return }
      if (res.status === 200) { setError('This email is already on the waitlist.'); return }
      localStorage.removeItem('lycho_ref_code')
      setSuccess({ position: json.data.position, referral_code: json.data.referral_code })
      // Load leaderboard
      fetch('/api/waitlist/leaderboard').then(r => r.json()).then(j => {
        if (j.data) setLeaderboard(j.data)
      }).catch(() => {})
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(getShareUrl(code))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleWhatsApp(code: string) {
    const link = getShareUrl(code)
    const msg = encodeURIComponent(`I just joined the LYCHO waitlist — the AI platform that runs your business 24/7. Join here: ${link}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <section id="waitlist" className="py-24 px-5" style={{ background: '#070707' }}>
      <div className="max-w-lg mx-auto text-center">
        <p className="text-xs font-sans uppercase tracking-widest mb-3" style={{ color: '#7a6130' }}>Early Access</p>
        <h2 className="font-bebas mb-3" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', color: '#F0EBE1', letterSpacing: '0.05em' }}>
          JOIN THE WAITLIST
        </h2>
        <p className="text-sm font-sans mb-10" style={{ color: '#6b6b6b' }}>
          Launching 1 January 2027. Be among the first businesses to run on LYCHO.
        </p>

        {success ? (
          <div className="rounded-2xl p-8" style={{ background: '#141414', border: '1px solid rgba(201,168,76,0.25)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(201,168,76,0.12)' }}>
              <Check size={22} style={{ color: '#C9A84C' }} />
            </div>
            <p className="font-bebas text-3xl mb-1" style={{ color: '#F0EBE1', letterSpacing: '0.05em' }}>You&apos;re #{success.position}</p>
            <p className="text-sm font-sans mb-2" style={{ color: '#6b6b6b' }}>on the LYCHO waitlist.</p>
            <p className="text-xs font-sans mb-6" style={{ color: '#C9A84C' }}>Refer friends to move up the list ↓</p>
            <div className="rounded-xl p-4 mb-4 text-left" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}>
              <p className="text-xs font-sans mb-3" style={{ color: '#6b6b6b' }}>Share your link to move up the list:</p>
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                <span className="flex-1 text-xs font-mono truncate" style={{ color: '#C9A84C' }}>{getShareUrl(success.referral_code)}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleCopy(success.referral_code)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-sans font-medium" style={copied ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' } : { background: '#1c1c1c', color: '#F0EBE1', border: '1px solid #2a2a2a' }}>
                  <Copy size={12} />{copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button onClick={() => handleWhatsApp(success.referral_code)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-sans font-medium" style={{ background: '#25D366', color: '#fff' }}>
                  <MessageCircle size={12} />WhatsApp
                </button>
              </div>
            </div>

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="rounded-xl p-4 text-left mt-4" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
                <p className="text-xs font-sans uppercase tracking-widest mb-3" style={{ color: '#6b6b6b' }}>Top Referrers</p>
                {leaderboard.map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < leaderboard.length - 1 ? '1px solid #1c1c1c' : 'none' }}>
                    <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>#{i + 1} · Referrer</span>
                    <span className="text-xs font-sans font-semibold" style={{ color: '#C9A84C' }}>{row.referral_count} referrals</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl p-8" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Your name (optional)" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm font-sans outline-none" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1' }} />
              <input type="email" placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-lg text-sm font-sans outline-none" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1' }} />
              {error && <p className="text-xs font-sans text-left" style={{ color: '#ef4444' }}>{error}</p>}
              <button type="submit" disabled={loading || !email} className="w-full py-3 rounded-lg text-sm font-sans font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity hover:opacity-85" style={{ background: '#C9A84C', color: '#070707' }}>
                {loading ? 'Joining…' : <><ArrowRight size={15} />Request Early Access</>}
              </button>
            </form>
            <div className="mt-4 flex items-center justify-center gap-4">
              <Link href="/login" className="text-xs font-sans transition-opacity hover:opacity-70" style={{ color: '#6b6b6b' }}>Sign in</Link>
              <span style={{ color: '#2a2a2a' }}>·</span>
              <Link href="/signup" className="text-xs font-sans transition-opacity hover:opacity-70" style={{ color: '#6b6b6b' }}>Create account</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const SECTORS = [
  { name: 'Sales & Marketing',    agents: 25, examples: ['Lead Qualifier', 'Sales Closer', 'Cold Outreach'] },
  { name: 'Customer Service',     agents: 25, examples: ['Complaint Handler', 'Returns & Refunds', 'Live Chat'] },
  { name: 'Healthcare',           agents: 25, examples: ['Patient Intake', 'Medical Follow-up', 'Appointment Scheduler'] },
  { name: 'Legal',                agents: 20, examples: ['Legal Intake', 'Contract Review', 'Compliance Checker'] },
  { name: 'Finance & Accounting', agents: 25, examples: ['Invoice Agent', 'Tax Assistant', 'Payroll Agent'] },
  { name: 'Real Estate',          agents: 20, examples: ['Property Enquiry', 'Tenant Support', 'Rental Manager'] },
  { name: 'Education',            agents: 20, examples: ['Student Admissions', 'Tutor Assistant', 'Career Counsellor'] },
  { name: 'Hospitality',          agents: 20, examples: ['Restaurant Booking', 'Hotel Concierge', 'Event Coordinator'] },
  { name: 'Ecommerce & Retail',   agents: 25, examples: ['Order Tracking', 'Product Advisor', 'Cart Recovery'] },
  { name: 'Logistics',            agents: 20, examples: ['Shipment Coordinator', 'Customs Agent', 'Freight Broker'] },
  { name: 'HR & Recruitment',     agents: 20, examples: ['Recruitment Screener', 'Employee Onboarding', 'HR Helpdesk'] },
  { name: 'Construction',         agents: 15, examples: ['Project Enquiry', 'Planning Permission', 'Site Safety'] },
  { name: 'Automotive',           agents: 15, examples: ['Vehicle Service', 'Car Sales', 'Auto Finance'] },
  { name: 'Insurance',            agents: 15, examples: ['Claims Handler', 'Policy Advisor', 'Renewal Agent'] },
  { name: 'Technology',           agents: 20, examples: ['IT Helpdesk', 'Software Support', 'Cybersecurity Agent'] },
  { name: 'Government',           agents: 15, examples: ['Citizen Services', 'Tax Filing', 'Permit Agent'] },
  { name: 'Agriculture',          agents: 10, examples: ['Crop Advisory', 'Livestock Agent', 'Market Prices'] },
  { name: 'Media & Entertainment',agents: 10, examples: ['Content Creator', 'PR Agent', 'Advertising Agent'] },
  { name: 'Non-Profit',           agents: 10, examples: ['Donor Relations', 'Volunteer Coordinator', 'Grant Writing'] },
  { name: 'Professional Services',agents: 15, examples: ['Consulting Intake', 'Strategy Agent', 'Management Consulting'] },
]

export default function Home() {
  const [annual, setAnnual] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  const PLANS = [
    { id: 'starter',    name: 'Starter',    priceM: 9900,   priceA: 7920,  highlight: false },
    { id: 'growth',     name: 'Growth',     priceM: 24900,  priceA: 19920, highlight: true  },
    { id: 'business',   name: 'Business',   priceM: 59900,  priceA: 47920, highlight: false },
    { id: 'enterprise', name: 'Enterprise', priceM: 120000, priceA: 96000, highlight: false },
  ]

  return (
    <>
      <Suspense fallback={null}><RefCapture /></Suspense>
      <Nav />

      <div style={{ background: '#070707', color: '#F0EBE1' }}>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="relative flex flex-col items-center justify-center text-center px-5 overflow-hidden"
          style={{ minHeight: '100vh', paddingTop: '80px', paddingBottom: '80px' }}
        >
          {/* Animated background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(201,168,76,0.07) 0%, transparent 70%)',
              animation: 'heroGlow 6s ease-in-out infinite alternate',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 40% 30% at 50% 50%, rgba(201,168,76,0.04) 0%, transparent 70%)',
              animation: 'heroGlow 4s ease-in-out 1s infinite alternate',
            }}
          />

          <div className="relative z-10 max-w-4xl mx-auto w-full flex flex-col items-center">
            <div className="mb-8">
              <Logo size="lg" />
            </div>

            <p
              className="font-bebas tracking-[0.3em] mb-6 uppercase"
              style={{ color: '#C9A84C', fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)', opacity: 0.8 }}
            >
              Intelligence. Transmitted.
            </p>

            <h1
              className="font-bebas mb-4 leading-[0.95]"
              style={{ fontSize: 'clamp(2.8rem, 8vw, 6.5rem)', color: '#F0EBE1', letterSpacing: '0.03em' }}
            >
              Your Business.<br />Running 24/7.<br />
              <span style={{ color: '#C9A84C' }}>In Every Language.</span>
            </h1>

            <p
              className="font-sans mb-10 mx-auto"
              style={{ color: '#6b6b6b', fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', maxWidth: '580px', lineHeight: 1.7 }}
            >
              LYCHO deploys a complete AI workforce across every department of your business. 370+ specialist agents. 20 sectors. Running 24/7.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="flex items-center gap-2 px-8 py-4 rounded-xl font-sans font-semibold text-sm transition-all hover:opacity-90 hover:scale-105"
                style={{ background: '#C9A84C', color: '#070707' }}
              >
                Start 7-Day Trial — PKR 999
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/demo"
                className="flex items-center gap-2 px-8 py-4 rounded-xl font-sans text-sm transition-colors"
                style={{ border: '1px solid #2a2a2a', color: '#6b6b6b' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#C9A84C'; (e.currentTarget as HTMLElement).style.color = '#C9A84C' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; (e.currentTarget as HTMLElement).style.color = '#6b6b6b' }}
              >
                Live Demo — No Signup Required
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{ animation: 'bounce 2s ease-in-out infinite' }}>
            <div className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5" style={{ border: '1px solid rgba(201,168,76,0.3)' }}>
              <div className="w-1 h-2 rounded-full" style={{ background: '#C9A84C', animation: 'scrollDot 2s ease-in-out infinite' }} />
            </div>
          </div>
        </section>

        {/* ── STATS BAR ────────────────────────────────────────────────────── */}
        <div style={{ borderTop: '2px solid rgba(201,168,76,0.3)', borderBottom: '1px solid #2a2a2a', background: '#0d0d0d' }}>
          <div className="max-w-6xl mx-auto px-5 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: '370+',    label: 'Specialist Agents' },
              { num: '20',      label: 'Business Sectors' },
              { num: '47',      label: 'Surfaces' },
              { num: '24/7',    label: 'Always On' },
            ].map(s => (
              <div key={s.num} className="text-center">
                <p className="font-bebas" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#C9A84C', letterSpacing: '0.04em', lineHeight: 1 }}>{s.num}</p>
                <p className="text-xs font-sans mt-1" style={{ color: '#6b6b6b' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── PROBLEM ──────────────────────────────────────────────────────── */}
        <section id="features" className="py-24 px-5" style={{ background: '#070707' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-sans uppercase tracking-widest mb-3" style={{ color: '#ef4444', opacity: 0.8 }}>The Problem</p>
              <h2 className="font-bebas mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#F0EBE1', letterSpacing: '0.05em' }}>
                THREE PROBLEMS<br />KILLING YOUR BUSINESS
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'No Intelligence Layer', body: 'No one monitoring your market, tracking competitors, managing compliance, or running your operations while you sleep.' },
                { title: 'Departments In Isolation', body: 'Sales doesn\'t talk to compliance. Operations doesn\'t talk to analytics. Your business leaks money through the gaps.' },
                { title: 'Paying For Manual Work', body: 'Invoicing, scheduling, reporting, follow-ups, content creation — all of it should run itself.' },
              ].map(card => (
                <div key={card.title} className="rounded-xl p-6" style={{ background: '#141414', borderLeft: '2px solid rgba(239,68,68,0.5)', border: '1px solid #1e1e1e', borderLeftWidth: '2px', borderLeftColor: 'rgba(239,68,68,0.5)' }}>
                  <h3 className="font-bebas text-xl mb-3" style={{ color: '#F0EBE1', letterSpacing: '0.05em' }}>{card.title}</h3>
                  <p className="text-sm font-sans leading-relaxed" style={{ color: '#6b6b6b' }}>{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SOLUTION ─────────────────────────────────────────────────────── */}
        <section className="py-24 px-5" style={{ background: '#0d0d0d' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-sans uppercase tracking-widest mb-3" style={{ color: '#7a6130' }}>The Solution</p>
              <h2 className="font-bebas mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#F0EBE1', letterSpacing: '0.05em' }}>
                LYCHO RUNS YOUR ENTIRE BUSINESS
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: '370+ Specialist Agents', body: 'A specialist for every business function. Sales. Legal. Finance. HR. Healthcare. Logistics. Each one expert in their domain. Deploy exactly what your business needs.' },
                { title: 'Every Sector. Every Function.', body: 'Sales & Marketing. Legal. Finance. Healthcare. Real Estate. HR. Logistics. Ecommerce. Construction. Technology. Education. Hospitality. And more.' },
                { title: 'Gets Smarter Every Day', body: 'Every conversation makes your agents more intelligent. Every interaction builds your business knowledge. The longer LYCHO runs, the better it performs.' },
              ].map(card => (
                <div key={card.title} className="rounded-xl p-6" style={{ background: '#141414', borderLeft: '2px solid #C9A84C', border: '1px solid #1e1e1e', borderLeftWidth: '2px', borderLeftColor: '#C9A84C' }}>
                  <h3 className="font-bebas text-xl mb-3" style={{ color: '#C9A84C', letterSpacing: '0.05em' }}>{card.title}</h3>
                  <p className="text-sm font-sans leading-relaxed" style={{ color: '#6b6b6b' }}>{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AGENT UNIVERSE ───────────────────────────────────────────────── */}
        <section id="agents" className="py-24 px-5" style={{ background: '#070707' }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-sans uppercase tracking-widest mb-3" style={{ color: '#7a6130' }}>Your AI Workforce</p>
              <h2 className="font-bebas mb-3" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#C9A84C', letterSpacing: '0.05em' }}>
                370+ SPECIALIST AGENTS ACROSS 20 SECTORS
              </h2>
              <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>
                Not a chatbot. A complete AI workforce running every department of your business.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-8">
              {SECTORS.map(sector => (
                <Link
                  key={sector.name}
                  href="/signup"
                  className="rounded-xl p-4 flex flex-col transition-all duration-200 no-underline"
                  style={{ background: '#141414', border: '1px solid #2a2a2a' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.4)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(201,168,76,0.06)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                >
                  <p className="text-sm font-sans font-semibold mb-1" style={{ color: '#F0EBE1' }}>{sector.name}</p>
                  <p className="text-xs font-sans mb-2" style={{ color: '#C9A84C' }}>{sector.agents} specialist agents</p>
                  <p className="text-xs font-sans leading-relaxed" style={{ color: '#555' }}>{sector.examples.join(' · ')}</p>
                </Link>
              ))}
            </div>

            <p className="text-center text-xs font-sans" style={{ color: '#555' }}>
              New specialist agents added every week across all sectors.
            </p>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-24 px-5" style={{ background: '#0d0d0d' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-sans uppercase tracking-widest mb-3" style={{ color: '#7a6130' }}>Setup</p>
              <h2 className="font-bebas mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#F0EBE1', letterSpacing: '0.05em' }}>
                UP AND RUNNING IN 14 MINUTES
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { n: '01', title: 'Create your account in 2 minutes', body: 'PKR 999 — fully refunded if cancelled. Start your 7-day trial instantly.' },
                { n: '02', title: 'Browse & deploy specialist agents', body: 'Browse 370+ specialist agents and deploy the ones your business needs.' },
                { n: '03', title: 'Connect your channels', body: 'Web, email, Telegram and more. One platform. Every surface.' },
                { n: '04', title: 'Your AI workforce runs itself', body: 'Every department. Automatically. Intelligently. Every day.' },
              ].map(step => (
                <div key={step.n} className="flex items-start gap-5 p-6 rounded-xl" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
                  <span className="font-bebas shrink-0" style={{ fontSize: '3rem', color: '#C9A84C', letterSpacing: '0.04em', lineHeight: 1, opacity: 0.6 }}>{step.n}</span>
                  <div>
                    <h3 className="text-sm font-sans font-semibold mb-1" style={{ color: '#F0EBE1' }}>{step.title}</h3>
                    <p className="text-xs font-sans leading-relaxed" style={{ color: '#6b6b6b' }}>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ──────────────────────────────────────────────────────── */}
        <section id="pricing" className="py-24 px-5" style={{ background: '#070707' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-sans uppercase tracking-widest mb-3" style={{ color: '#7a6130' }}>Pricing</p>
              <h2 className="font-bebas mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#F0EBE1', letterSpacing: '0.05em' }}>
                SIMPLE PRICING.<br />EXTRAORDINARY VALUE.
              </h2>
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-3 mb-10">
              <span className="text-sm font-sans" style={{ color: annual ? '#6b6b6b' : '#F0EBE1' }}>Monthly</span>
              <button className="relative w-11 h-6 rounded-full transition-colors" style={{ background: annual ? '#C9A84C' : '#2a2a2a' }} onClick={() => setAnnual(v => !v)}>
                <span className="absolute top-1 w-4 h-4 rounded-full transition-transform" style={{ background: annual ? '#070707' : '#6b6b6b', left: annual ? 'calc(100% - 20px)' : '4px' }} />
              </button>
              <span className="text-sm font-sans" style={{ color: annual ? '#F0EBE1' : '#6b6b6b' }}>
                Annual <span className="text-xs px-2 py-0.5 rounded-full font-sans ml-1" style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>Save 20%</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              {PLANS.map(plan => (
                <div
                  key={plan.id}
                  className="rounded-xl p-6 flex flex-col relative"
                  style={{
                    background:  plan.highlight ? 'rgba(201,168,76,0.06)' : '#141414',
                    border:      plan.highlight ? '1px solid rgba(201,168,76,0.35)' : '1px solid #2a2a2a',
                  }}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1 rounded-full font-sans font-semibold" style={{ background: '#C9A84C', color: '#070707' }}>
                      MOST POPULAR
                    </span>
                  )}
                  <p className="text-xs font-sans uppercase tracking-widest mb-2" style={{ color: '#C9A84C' }}>{plan.name}</p>
                  <div className="mb-4">
                    <span className="font-bebas text-3xl" style={{ color: '#F0EBE1', letterSpacing: '0.02em' }}>
                      {plan.id === 'enterprise' ? 'Custom' : `PKR ${(annual ? plan.priceA : plan.priceM).toLocaleString('en-PK')}`}
                    </span>
                    {plan.id !== 'enterprise' && <span className="text-xs font-sans ml-1" style={{ color: '#6b6b6b' }}>/mo</span>}
                  </div>
                  <p className="text-xs font-sans mb-3" style={{ color: '#6b6b6b' }}>
                    {plan.id === 'enterprise' ? '7-day trial PKR 999 then custom pricing' : `7-day trial PKR 999 then PKR ${(annual ? plan.priceA : plan.priceM).toLocaleString('en-PK')}/mo`}
                  </p>
                  <Link
                    href="/signup"
                    className="mt-auto w-full py-2.5 rounded-lg text-xs font-sans font-medium text-center transition-opacity hover:opacity-80 block"
                    style={plan.highlight ? { background: '#C9A84C', color: '#070707' } : { background: '#1c1c1c', color: '#F0EBE1', border: '1px solid #2a2a2a' }}
                  >
                    Start 7-Day Trial — PKR 999
                  </Link>
                  <Link
                    href="/demo"
                    className="mt-2 w-full py-2 rounded-lg text-xs font-sans text-center transition-colors block"
                    style={{ border: '1px solid #2a2a2a', color: '#6b6b6b' }}
                  >
                    Live Demo — No Signup Required
                  </Link>
                </div>
              ))}
            </div>

            <p className="text-center text-xs font-sans" style={{ color: '#6b6b6b' }}>
              All plans include a 7-day trial — PKR 999, fully refunded if cancelled within 7 days.
            </p>
          </div>
        </section>

        {/* ── WAITLIST ─────────────────────────────────────────────────────── */}
        <Suspense fallback={null}>
          <WaitlistSection />
        </Suspense>

        {/* ── FOOTER ───────────────────────────────────────────────────────── */}
        <footer className="py-12 px-5" style={{ borderTop: '1px solid #2a2a2a', background: '#0d0d0d' }}>
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
              <Logo size="sm" />
              <div className="flex flex-wrap gap-6">
                {(['Product', 'Pricing', 'About', 'Contact', 'Privacy'] as const).map(l => (
                  <a key={l} href="#" className="text-xs font-sans transition-colors" style={{ color: '#6b6b6b' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#F0EBE1')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#6b6b6b')}
                  >{l}</a>
                ))}
                <a href="/developers" className="text-xs font-sans transition-colors" style={{ color: '#6b6b6b' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#C9A84C')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#6b6b6b')}
                >Developers</a>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: '24px' }} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
              <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>© 2027 LYCHO Systems. Intelligence. Transmitted.</p>
              <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Built in Pakistan. Built for the world.</p>
            </div>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        html { scroll-behavior: smooth; }
        @keyframes heroGlow {
          from { opacity: 0.6; transform: scale(1); }
          to   { opacity: 1;   transform: scale(1.05); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(6px); }
        }
        @keyframes scrollDot {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50%       { opacity: 1;   transform: translateY(4px); }
        }
      `}</style>
    </>
  )
}
