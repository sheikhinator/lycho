import Link from 'next/link'
import { Mail } from 'lucide-react'

interface Props {
  searchParams: { email?: string }
}

export default function VerifyPage({ searchParams }: Props) {
  const email = searchParams.email ?? 'your email'

  return (
    <main className="min-h-screen bg-void flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">

        {/* Wordmark */}
        <h1 className="font-bebas text-5xl tracking-[0.2em] text-gold mb-10">LYCHO</h1>

        {/* Card */}
        <div className="bg-deep border border-border rounded-xl p-10">
          <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-6">
            <Mail size={24} className="text-gold" />
          </div>

          <h2 className="font-cormorant text-2xl text-ivory font-medium mb-3">
            Check your email
          </h2>

          <p className="text-sm text-muted leading-relaxed mb-2">
            We sent a verification link to
          </p>
          <p className="text-sm text-gold font-medium mb-6 break-all">{email}</p>

          <p className="text-sm text-muted leading-relaxed">
            Click the link in that email to activate your LYCHO account.
            The link expires in 24 hours.
          </p>

          <div className="mt-8 pt-6 border-t border-border space-y-3">
            <p className="text-xs text-muted">Didn&apos;t receive the email?</p>
            <p className="text-xs text-muted">
              Check your spam folder, or{' '}
              <Link href="/signup" className="text-gold hover:text-pulse transition-colors">
                try signing up again
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
