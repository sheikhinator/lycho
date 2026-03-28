'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { AGENT_CATALOGUE } from '@/lib/agents-catalogue'
import {
  Check, ArrowRight, Copy, MessageCircle, Menu, X,
  MessageSquare, Search, Settings, Users, BarChart2, Shield, FileText,
} from 'lucide-react'

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

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  MessageSquare, Search, Settings, Users, BarChart2, Shield, FileText,
}

function AgentIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name]
  return Icon ? <Icon size={20} /> : <MessageSquare size={20} />
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
            Start Free Trial
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
            <Link href="/signup" className="text-sm font-sans font-medium py-2.5 text-center rounded-lg" style={{ background: '#C9A84C', color: '#070707' }} onClick={() => setOpen(false)}>Start Free Trial</Link>
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
            <p className="text-sm font-sans mb-6" style={{ color: '#6b6b6b' }}>on the LYCHO waitlist.</p>
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
export default function Home() {
  const [annual, setAnnual] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  const coreAgents = AGENT_CATALOGUE.core.slice(0, 6)

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
          style={{ minHeight: '100vh', paddingTop: '80px' }}
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

          <div className="relative z-10 max-w-4xl mx-auto">
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
              LYCHO deploys an AI workforce that handles every customer interaction — on WhatsApp, email, web, and 44 other surfaces — while you focus on growing.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="flex items-center gap-2 px-8 py-4 rounded-xl font-sans font-semibold text-sm transition-all hover:opacity-90 hover:scale-105"
                style={{ background: '#C9A84C', color: '#070707' }}
              >
                Start Free Trial <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>— 14 days free</span>
                <ArrowRight size={16} />
              </Link>
              <a
                href="#how-it-works"
                className="flex items-center gap-2 px-8 py-4 rounded-xl font-sans text-sm transition-colors"
                style={{ border: '1px solid #2a2a2a', color: '#6b6b6b' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#C9A84C'; (e.currentTarget as HTMLElement).style.color = '#C9A84C' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; (e.currentTarget as HTMLElement).style.color = '#6b6b6b' }}
              >
                See How It Works
              </a>
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
              { num: '70+',     label: 'AI Agents Ready to Deploy' },
              { num: '47',      label: 'Surfaces. WhatsApp to Voice.' },
              { num: '24/7',    label: 'Always On. Never Tired.' },
              { num: '14 Days', label: 'Free Trial. No Card.' },
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
                YOUR BUSINESS IS LOSING CUSTOMERS<br />RIGHT NOW
              </h2>
              <p className="text-sm font-sans mx-auto" style={{ color: '#6b6b6b', maxWidth: '500px' }}>
                Every unanswered message is a lost sale. Every repetitive task is wasted human potential.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Missed at 2AM', body: 'Customers message outside office hours. They don\'t wait. They move on.' },
                { title: 'Buried in Repetition', body: 'Your team answers the same questions 40 times a day. That\'s 40 opportunities to do something that matters.' },
                { title: 'No Intelligence', body: 'You have no idea what customers actually need until it\'s too late. Every missed conversation is a missed insight.' },
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
                LYCHO RUNS YOUR BUSINESS<br />WHILE YOU SLEEP
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Always On', body: 'Every message answered in seconds. In Urdu, English, Arabic, or any language your customer speaks. 24 hours. 7 days.' },
                { title: 'Always Learning', body: 'Every conversation makes your agents smarter. Every interaction builds your customer intelligence. The longer it runs, the better it gets.' },
                { title: 'Always Everywhere', body: 'WhatsApp, email, web, SMS, Instagram, Facebook. One intelligence. 47 surfaces. One unified customer picture.' },
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
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-sans uppercase tracking-widest mb-3" style={{ color: '#7a6130' }}>Your AI Workforce</p>
              <h2 className="font-bebas mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#C9A84C', letterSpacing: '0.05em' }}>
                YOUR AI WORKFORCE
              </h2>
              <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>
                500+ specialist agents across 20 sectors. Deploy the ones your business needs.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {coreAgents.map(agent => (
                <div
                  key={agent.type}
                  className="rounded-xl p-5 transition-all duration-200"
                  style={{ background: '#141414', border: '1px solid #2a2a2a' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.35)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(201,168,76,0.07)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
                    <AgentIcon name={agent.icon} />
                  </div>
                  <p className="text-sm font-sans font-medium mb-1" style={{ color: '#F0EBE1' }}>{agent.name}</p>
                  <p className="text-xs font-sans leading-relaxed" style={{ color: '#6b6b6b' }}>{agent.description}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/dashboard/marketplace"
                className="inline-flex items-center gap-2 text-sm font-sans transition-opacity hover:opacity-80"
                style={{ color: '#C9A84C' }}
              >
                + 494 more agents across Healthcare, Legal, Finance, Real Estate, Education and 15 more sectors
                <ArrowRight size={14} />
              </Link>
            </div>
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
                { n: '01', title: 'Sign up in 2 minutes',           body: 'No credit card required. Start your 14-day free trial instantly.' },
                { n: '02', title: 'Deploy your first agent in 5 minutes', body: 'Choose from 500+ specialist agents. One click to deploy.' },
                { n: '03', title: 'Connect WhatsApp in 5 minutes',  body: 'Just your phone number. No API registration. Just connect.' },
                { n: '04', title: 'Your business never sleeps again', body: 'From minute 14 onwards — every customer gets an instant, intelligent response.' },
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
                  <Link
                    href="/signup"
                    className="mt-auto w-full py-2.5 rounded-lg text-xs font-sans font-medium text-center transition-opacity hover:opacity-80 block"
                    style={plan.highlight ? { background: '#C9A84C', color: '#070707' } : { background: '#1c1c1c', color: '#F0EBE1', border: '1px solid #2a2a2a' }}
                  >
                    Start Free Trial
                  </Link>
                </div>
              ))}
            </div>

            <p className="text-center text-xs font-sans" style={{ color: '#6b6b6b' }}>
              All plans include 14-day free trial. No credit card required.
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
                {['Product', 'Pricing', 'About', 'Contact', 'Privacy'].map(l => (
                  <a key={l} href="#" className="text-xs font-sans transition-colors" style={{ color: '#6b6b6b' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#F0EBE1')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#6b6b6b')}
                  >{l}</a>
                ))}
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
