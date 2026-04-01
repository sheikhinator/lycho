'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: '#070707', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ color: '#C9A84C', fontFamily: 'sans-serif', fontSize: 24 }}>Something went wrong</h2>
      <p style={{ color: '#666', fontSize: 14 }}>{error.message}</p>
      <button onClick={reset} style={{ background: '#C9A84C', color: '#070707', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 700 }}>
        Try again
      </button>
    </div>
  )
}
