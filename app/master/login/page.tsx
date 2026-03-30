'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

// ─── LYCHO Master Login ────────────────────────────────────────────────────────
export default function MasterLoginPage() {
  const router = useRouter()
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/master/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      })
      if (res.ok) {
        router.replace('/master')
      } else {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'Invalid master secret')
      }
    } catch {
      setError('Network error — try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#070707',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        width: 380,
        background: '#141414',
        border: '1px solid #222',
        borderRadius: 12,
        padding: '40px 36px',
      }}>
        {/* Logo + title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 36,
            color: '#C9A84C',
            letterSpacing: 4,
          }}>
            LYCHO
          </div>
          <div style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 22,
            color: '#fff',
            letterSpacing: 3,
            marginTop: 2,
          }}>
            MASTER ACCESS
          </div>
          <div style={{ width: 48, height: 2, background: '#C9A84C', margin: '12px auto 0' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', color: '#888', fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>
            MASTER SECRET
          </label>
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="Enter master secret"
            required
            autoFocus
            style={{
              width: '100%',
              background: '#0d0d0d',
              border: '1px solid #333',
              borderRadius: 8,
              padding: '12px 14px',
              color: '#fff',
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.target.style.borderColor = '#C9A84C')}
            onBlur={e => (e.target.style.borderColor = '#333')}
          />

          {error && (
            <div style={{
              marginTop: 12,
              padding: '10px 14px',
              background: 'rgba(220,38,38,0.12)',
              border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: 6,
              color: '#f87171',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !secret}
            style={{
              marginTop: 24,
              width: '100%',
              background: loading ? '#7a6130' : '#C9A84C',
              color: '#070707',
              border: 'none',
              borderRadius: 8,
              padding: '13px 0',
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 18,
              letterSpacing: 3,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'AUTHENTICATING…' : 'ENTER MASTER'}
          </button>
        </form>
      </div>
    </div>
  )
}
