import { cookies } from 'next/headers'
import Link from 'next/link'

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV = [
  { label: 'Dashboard',   href: '/master' },
  { label: 'Tenants',     href: '/master/tenants' },
  { label: 'Forge Queue', href: '/master/forge' },
  { label: 'Waitlist',    href: '/master/waitlist' },
  { label: 'System',      href: '/master/system' },
]

// Server component — guard: master_session cookie must exist.
// When no session is present, children render bare (no sidebar, no redirect).
// This covers /master/login without causing an infinite redirect loop.
// Authenticated pages redirect to /master/login via their own logic or this layout.
export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const session = cookieStore.get('master_session')

  // No valid session → render children bare (no sidebar).
  // Covers /master/login without an infinite redirect loop.
  // Other master pages show no data since their API calls require MASTER_SECRET.
  if (!session?.value) {
    return <>{children}</>
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#070707', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside style={{
        width: 220,
        minHeight: '100vh',
        background: '#141414',
        borderRight: '1px solid #222',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid #222' }}>
          <div style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 28,
            color: '#C9A84C',
            letterSpacing: 4,
            lineHeight: 1,
          }}>
            LYCHO
          </div>
          <span style={{
            display: 'inline-block',
            marginTop: 6,
            background: '#dc2626',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 2,
            padding: '2px 8px',
            borderRadius: 4,
          }}>
            MASTER
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {NAV.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: 'block',
                padding: '10px 20px',
                color: '#aaa',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: 0.5,
                transition: 'color 0.15s, background 0.15s',
                borderLeft: '2px solid transparent',
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #222', color: '#444', fontSize: 11 }}>
          LYCHO Master v1.0
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}

