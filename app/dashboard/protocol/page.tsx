'use client'
import { useEffect, useState } from 'react'

export default function ProtocolPage() {
  const [spec, setSpec] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/protocol').then(r => r.json()).then(d => { setSpec(d); setLoading(false) })
  }, [])

  const codeStyle = { background: '#141414', border: '1px solid #2a2a2a', borderRadius: 6, padding: '12px 16px', color: '#4ade80', fontSize: 12, fontFamily: 'monospace', overflowX: 'auto' as const, whiteSpace: 'pre' as const }

  return (
    <div style={{ minHeight: '100vh', background: '#070707', padding: '32px 24px', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 4px', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 2 }}>LYCHO PROTOCOL</h1>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 32 }}>Open standard for agent communication. Connect anything to LYCHO.</p>

        {loading ? <div style={{ color: '#444', textAlign: 'center', padding: 60 }}>Loading protocol spec...</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {[
                { label: 'Protocol', value: spec?.protocol },
                { label: 'Version', value: spec?.version },
                { label: 'Agents', value: spec?.total_agents },
              ].map(s => (
                <div key={s.label} style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: 20, textAlign: 'center' }}>
                  <div style={{ color: '#C9A84C', fontWeight: 700, fontSize: 18 }}>{s.value}</div>
                  <div style={{ color: '#666', fontSize: 12 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: 24 }}>
              <div style={{ color: '#C9A84C', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>CONNECT TO LYCHO</div>
              <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>Claude Code / MCP config:</div>
              <div style={codeStyle}>{`{
  "mcpServers": {
    "lycho": {
      "url": "${typeof window !== 'undefined' ? window.location.origin : 'https://lycho.vercel.app'}/api/mcp",
      "apiKey": "YOUR_LYCHO_API_KEY"
    }
  }
}`}</div>
            </div>

            <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: 24 }}>
              <div style={{ color: '#C9A84C', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>REST API</div>
              <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>Execute any agent:</div>
              <div style={codeStyle}>{`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : 'https://lycho.vercel.app'}/api/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "tool": "lycho_research",
    "input": {"message": "Your query here"},
    "api_key": "YOUR_LYCHO_API_KEY"
  }'`}</div>
            </div>

            <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: 24 }}>
              <div style={{ color: '#C9A84C', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>CAPABILITIES</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {spec?.capabilities?.map((c: string) => (
                  <span key={c} style={{ background: '#141414', border: '1px solid #C9A84C33', borderRadius: 6, padding: '4px 12px', color: '#C9A84C', fontSize: 12 }}>{c}</span>
                ))}
              </div>
            </div>

            <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: 24 }}>
              <div style={{ color: '#C9A84C', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>AVAILABLE AGENTS ({spec?.total_agents})</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
                {spec?.agents?.slice(0, 12).map((a: any) => (
                  <div key={a.id} style={{ background: '#141414', border: '1px solid #1a1a1a', borderRadius: 6, padding: '10px 12px' }}>
                    <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{a.name}</div>
                    <div style={{ color: '#555', fontSize: 11 }}>{a.sector}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
