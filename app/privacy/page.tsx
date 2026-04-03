import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

export const metadata: Metadata = {
  title: 'Privacy Policy — LYCHO',
  description: 'Privacy Policy for LYCHO AI agent platform.',
}

export default function PrivacyPage() {
  return (
    <div style={{ background: '#070707', minHeight: '100vh', color: '#F0EBE1' }}>
      <nav
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(7,7,7,0.95)', borderBottom: '1px solid #2a2a2a', backdropFilter: 'blur(12px)' }}
      >
        <Link href="/"><Logo size="sm" /></Link>
        <Link href="/signup" className="text-sm font-sans px-4 py-2 rounded transition-colors"
          style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
          Get Started
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-5 lg:px-8 py-16">
        <p className="text-xs font-sans uppercase tracking-[0.3em] mb-2" style={{ color: '#7a6130' }}>Legal</p>
        <h1 className="font-bebas text-5xl tracking-[0.15em] mb-2" style={{ color: '#C9A84C' }}>Privacy Policy</h1>
        <p className="text-sm font-sans mb-12" style={{ color: '#6b6b6b' }}>Last updated: April 3, 2026</p>

        <div className="space-y-10">
          <section>
            <h2 className="font-bebas text-2xl tracking-[0.1em] mb-3" style={{ color: '#F0EBE1' }}>1. Information We Collect</h2>
            <p className="text-sm font-sans leading-relaxed" style={{ color: '#6b6b6b' }}>
              We collect information you provide directly, including: business name, email address, phone number,
              and sector. We also collect usage data such as agent interactions, conversation metadata,
              and analytics metrics. Payment information is processed by our payment providers (Safepay, Xpay)
              and is not stored on our servers.
            </p>
          </section>

          <section>
            <h2 className="font-bebas text-2xl tracking-[0.1em] mb-3" style={{ color: '#F0EBE1' }}>2. How We Use Your Information</h2>
            <p className="text-sm font-sans leading-relaxed" style={{ color: '#6b6b6b' }}>
              We use your information to: provide and improve the Platform; process payments; send service
              notifications and updates; detect and prevent fraud; generate analytics and reports;
              comply with legal obligations.
            </p>
          </section>

          <section>
            <h2 className="font-bebas text-2xl tracking-[0.1em] mb-3" style={{ color: '#F0EBE1' }}>3. Data Sharing</h2>
            <p className="text-sm font-sans leading-relaxed" style={{ color: '#6b6b6b' }}>
              We do not sell your personal information. We share data only with: service providers who assist
              in operating the Platform (Supabase, Anthropic, Resend, Upstash); payment processors;
              law enforcement when required by law. AI model providers (Anthropic) process conversation
              data to generate responses but do not use it for model training.
            </p>
          </section>

          <section>
            <h2 className="font-bebas text-2xl tracking-[0.1em] mb-3" style={{ color: '#F0EBE1' }}>4. Data Security</h2>
            <p className="text-sm font-sans leading-relaxed" style={{ color: '#6b6b6b' }}>
              We implement industry-standard security measures including: encryption in transit (TLS 1.3);
              encryption at rest; row-level security in our database; HMAC signature verification for webhooks;
              rate limiting on all API endpoints; input sanitisation to prevent prompt injection.
              However, no system is 100% secure and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-bebas text-2xl tracking-[0.1em] mb-3" style={{ color: '#F0EBE1' }}>5. Data Retention</h2>
            <p className="text-sm font-sans leading-relaxed" style={{ color: '#6b6b6b' }}>
              We retain your data for as long as your account is active. After account deletion, data is
              retained for 30 days for backup purposes, then permanently deleted. Conversation data is
              retained for the lifetime of your subscription.
            </p>
          </section>

          <section>
            <h2 className="font-bebas text-2xl tracking-[0.1em] mb-3" style={{ color: '#F0EBE1' }}>6. Your Rights</h2>
            <p className="text-sm font-sans leading-relaxed" style={{ color: '#6b6b6b' }}>
              You have the right to: access your personal data; correct inaccurate data; request deletion
              of your data; export your data; opt out of marketing communications; lodge a complaint with
              a data protection authority. To exercise these rights, contact us at hello@lycho.app.
            </p>
          </section>

          <section>
            <h2 className="font-bebas text-2xl tracking-[0.1em] mb-3" style={{ color: '#F0EBE1' }}>7. Cookies</h2>
            <p className="text-sm font-sans leading-relaxed" style={{ color: '#6b6b6b' }}>
              We use essential cookies for authentication and session management. We do not use third-party
              tracking cookies. You can manage cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="font-bebas text-2xl tracking-[0.1em] mb-3" style={{ color: '#F0EBE1' }}>8. Children&apos;s Privacy</h2>
            <p className="text-sm font-sans leading-relaxed" style={{ color: '#6b6b6b' }}>
              The Platform is not intended for individuals under 18 years of age. We do not knowingly
              collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="font-bebas text-2xl tracking-[0.1em] mb-3" style={{ color: '#F0EBE1' }}>9. Changes to This Policy</h2>
            <p className="text-sm font-sans leading-relaxed" style={{ color: '#6b6b6b' }}>
              We may update this Privacy Policy from time to time. We will notify you of material changes
              via email or through the Platform. Your continued use of the Platform after changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="font-bebas text-2xl tracking-[0.1em] mb-3" style={{ color: '#F0EBE1' }}>10. Contact</h2>
            <p className="text-sm font-sans leading-relaxed" style={{ color: '#6b6b6b' }}>
              For privacy-related questions, contact us at <a href="mailto:hello@lycho.app" style={{ color: '#C9A84C' }}>hello@lycho.app</a>.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8" style={{ borderTop: '1px solid #2a2a2a' }}>
          <div className="flex flex-wrap gap-4">
            <Link href="/terms" className="text-sm font-sans" style={{ color: '#C9A84C' }}>Terms of Service</Link>
            <Link href="/" className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Home</Link>
            <Link href="/signup" className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
