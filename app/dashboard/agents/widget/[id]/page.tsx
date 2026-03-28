'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Copy, Check, Code2, ExternalLink } from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lycho.vercel.app'

interface Agent {
  id: string
  display_name: string | null
  agent_type: string
  widget_token: string | null
}

export default function WidgetSetupPage() {
  const params   = useParams<{ id: string }>()
  const [agent, setAgent]   = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    document.title = 'Widget Setup — LYCHO'
    fetch(`/api/agents/${params.id}`)
      .then(r => r.json())
      .then(j => setAgent(j.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id])

  const embedCode = agent?.widget_token
    ? `<script src="${APP_URL}/widget.js" data-token="${agent.widget_token}"></script>`
    : null

  function handleCopy() {
    if (!embedCode) return
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const previewUrl = agent?.widget_token ? `${APP_URL}/widget/${agent.widget_token}` : null

  return (
    <div className="flex" style={{ background: '#070707', minHeight: '100vh' }}>
      <DashboardSidebar />

      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />

        <main className="flex-1 p-6 lg:p-10 max-w-3xl mx-auto w-full">

          {/* Header */}
          <div className="mb-8">
            <p className="text-xs font-sans uppercase tracking-widest mb-1" style={{ color: '#7a6130' }}>
              Agent Widget
            </p>
            <h1 className="font-bebas text-4xl tracking-[0.1em]" style={{ color: '#C9A84C' }}>
              Embed on Your Website
            </h1>
            <p className="text-sm font-sans mt-1" style={{ color: '#6b6b6b' }}>
              {loading ? 'Loading…' : (agent?.display_name ?? agent?.agent_type ?? 'Agent')}
            </p>
          </div>

          {loading ? (
            <div className="h-40 rounded-xl animate-pulse" style={{ background: '#141414' }} />
          ) : !agent?.widget_token ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ background: '#141414', border: '1px solid #2a2a2a' }}
            >
              <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>
                This agent doesn&apos;t have a widget token yet. Run the SQL migration in Supabase to generate tokens.
              </p>
              <code
                className="block mt-4 text-xs font-mono p-4 rounded-lg text-left"
                style={{ background: '#1c1c1c', color: '#C9A84C', border: '1px solid #2a2a2a' }}
              >
                {`UPDATE agents SET widget_token = gen_random_uuid()::text WHERE widget_token IS NULL;`}
              </code>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Embed code card */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
                <div
                  className="flex items-center justify-between px-5 py-4"
                  style={{ background: '#141414', borderBottom: '1px solid #2a2a2a' }}
                >
                  <div className="flex items-center gap-2">
                    <Code2 size={15} style={{ color: '#C9A84C' }} />
                    <span className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>Embed Code</span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-sans px-3 py-1.5 rounded-lg transition-colors"
                    style={copied
                      ? { background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
                      : { background: '#1c1c1c', color: '#F0EBE1', border: '1px solid #2a2a2a' }
                    }
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="p-5" style={{ background: '#0d0d0d' }}>
                  <code
                    className="text-xs font-mono break-all leading-relaxed"
                    style={{ color: '#C9A84C' }}
                  >
                    {embedCode}
                  </code>
                </div>
              </div>

              {/* Note */}
              <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
                When your domain changes to <span style={{ color: '#C9A84C' }}>lycho.ai</span> — update the{' '}
                <code style={{ color: '#F0EBE1' }}>src</code> URL in the script tag.
              </p>

              {/* Steps */}
              <div className="rounded-xl p-6 space-y-4" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
                <p className="text-xs font-sans uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>
                  Installation
                </p>
                {[
                  { n: '01', text: 'Copy the code above' },
                  { n: '02', text: "Open your website's HTML file" },
                  { n: '03', text: 'Paste before the closing </body> tag' },
                  { n: '04', text: 'Save and refresh — your LYCHO agent is live' },
                ].map(step => (
                  <div key={step.n} className="flex items-start gap-4">
                    <span className="font-bebas text-2xl shrink-0" style={{ color: '#C9A84C', letterSpacing: '0.05em', lineHeight: 1 }}>
                      {step.n}
                    </span>
                    <p className="text-sm font-sans pt-0.5" style={{ color: '#F0EBE1' }}>{step.text}</p>
                  </div>
                ))}
              </div>

              {/* Live preview link */}
              {previewUrl && (
                <div
                  className="rounded-xl p-5 flex items-center justify-between"
                  style={{ background: '#141414', border: '1px solid #2a2a2a' }}
                >
                  <div>
                    <p className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>Live Preview</p>
                    <p className="text-xs font-sans mt-0.5" style={{ color: '#6b6b6b' }}>Open the widget chat in a new tab</p>
                  </div>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-sans px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                    style={{ background: '#C9A84C', color: '#070707' }}
                  >
                    Preview <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
