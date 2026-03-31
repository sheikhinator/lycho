'use client'

import Link from 'next/link'
import { ArrowLeft, MessageCircle, Smartphone, Settings, CheckCircle } from 'lucide-react'

const STEPS = [
  {
    icon: Smartphone,
    title: 'Download WhatsApp Business',
    description: 'Download the WhatsApp Business app on your phone.',
    actions: [
      { label: 'App Store (iOS)', href: 'https://apps.apple.com/app/whatsapp-business/id1386412985' },
      { label: 'Play Store (Android)', href: 'https://play.google.com/store/apps/details?id=com.whatsapp.w4b' },
    ],
  },
  {
    icon: CheckCircle,
    title: 'Register Your Business Number',
    description: 'Open WhatsApp Business and register with your business phone number. Use a number dedicated to your business — not your personal WhatsApp number.',
    actions: [],
  },
  {
    icon: Settings,
    title: 'Configure Your Business Profile',
    description: 'Go to Settings → Business Profile. Fill in your business name, category, description, address, email, and website. This information appears to customers.',
    actions: [],
  },
  {
    icon: MessageCircle,
    title: 'Connect to LYCHO',
    description: 'Go to your LYCHO dashboard → Settings → Integrations → WhatsApp. Enter your business number and follow the verification steps. LYCHO will send a verification code to confirm the connection.',
    actions: [],
  },
]

const FAQ = [
  {
    q: 'Will my personal WhatsApp be affected?',
    a: 'No. WhatsApp Business is a separate app from regular WhatsApp. You can run both on the same device with different numbers, or use WhatsApp Business only.',
  },
  {
    q: 'Can I use my existing WhatsApp number?',
    a: 'Yes, but the number will be converted to a WhatsApp Business account. All existing chats are preserved. However, you cannot use the same number on both regular WhatsApp and WhatsApp Business simultaneously.',
  },
  {
    q: 'How long does verification take?',
    a: 'Phone number verification via SMS or call takes under 2 minutes. LYCHO integration verification typically completes within a few seconds.',
  },
  {
    q: 'Is there a cost for WhatsApp Business?',
    a: 'The WhatsApp Business app is free. Business Messaging API (for high-volume automated messaging) has per-message charges — but your LYCHO plan covers this.',
  },
  {
    q: 'What happens if a customer messages outside business hours?',
    a: 'LYCHO agents respond 24/7 regardless of business hours. You can configure away messages and handoff rules in your agent settings.',
  },
]

export default function WhatsAppSetupPage() {
  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-2 text-sm font-sans mb-8"
        style={{ color: '#6b6b6b', textDecoration: 'none' }}
      >
        <ArrowLeft size={14} />
        Back to Settings
      </Link>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(37,211,102,0.1)' }}
          >
            <MessageCircle size={20} style={{ color: '#25D366' }} />
          </div>
          <h1
            className="font-bebas tracking-wider"
            style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', color: '#F0EBE1', letterSpacing: '0.05em' }}
          >
            WhatsApp Business Setup
          </h1>
        </div>
        <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>
          Connect your WhatsApp Business account to LYCHO so your AI agents can handle customer conversations on WhatsApp.
        </p>
      </div>

      {/* Steps */}
      <div className="mb-12">
        <h2 className="text-xs font-sans font-medium uppercase tracking-widest mb-6" style={{ color: '#C9A84C', letterSpacing: '0.12em' }}>
          Setup Steps
        </h2>
        <div className="flex flex-col gap-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <div
                key={i}
                className="flex gap-4 p-5 rounded-xl"
                style={{ background: '#141414', border: '1px solid #2a2a2a' }}
              >
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-sans shrink-0"
                    style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}
                  >
                    {i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-px flex-1" style={{ background: '#2a2a2a', minHeight: '20px' }} />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={15} style={{ color: '#6b6b6b' }} />
                    <p className="text-sm font-sans font-semibold" style={{ color: '#F0EBE1' }}>{step.title}</p>
                  </div>
                  <p className="text-sm font-sans leading-relaxed mb-3" style={{ color: '#6b6b6b' }}>
                    {step.description}
                  </p>
                  {step.actions.length > 0 && (
                    <div className="flex gap-3 flex-wrap">
                      {step.actions.map(action => (
                        <a
                          key={action.label}
                          href={action.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-sans px-3 py-1.5 rounded-lg"
                          style={{ background: 'rgba(37,211,102,0.08)', color: '#25D366', border: '1px solid rgba(37,211,102,0.2)', textDecoration: 'none' }}
                        >
                          {action.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-xs font-sans font-medium uppercase tracking-widest mb-6" style={{ color: '#C9A84C', letterSpacing: '0.12em' }}>
          FAQ
        </h2>
        <div className="flex flex-col gap-4">
          {FAQ.map((item, i) => (
            <div key={i} className="p-5 rounded-xl" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
              <p className="text-sm font-sans font-semibold mb-2" style={{ color: '#F0EBE1' }}>{item.q}</p>
              <p className="text-sm font-sans leading-relaxed" style={{ color: '#6b6b6b' }}>{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 p-6 rounded-xl text-center" style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)' }}>
        <p className="text-sm font-sans font-semibold mb-1" style={{ color: '#F0EBE1' }}>Ready to connect?</p>
        <p className="text-xs font-sans mb-4" style={{ color: '#6b6b6b' }}>Head to Integrations to complete the WhatsApp connection.</p>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-sans font-semibold"
          style={{ background: '#C9A84C', color: '#070707', textDecoration: 'none' }}
        >
          Go to Integrations
        </Link>
      </div>
    </div>
  )
}
