import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: '#070707', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ color: '#C9A84C', fontFamily: 'sans-serif', fontSize: 48, fontWeight: 900 }}>404</h1>
      <p style={{ color: '#666', fontSize: 16 }}>This page doesn&apos;t exist.</p>
      <Link href="/" style={{ color: '#C9A84C', fontSize: 14 }}>← Back to LYCHO</Link>
    </div>
  )
}
