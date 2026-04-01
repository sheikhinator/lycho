'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Globe, Bell, Menu, LogOut, Settings, ChevronDown, Zap, AlertTriangle, Bot, CreditCard, Clock, MessageCircle } from 'lucide-react'
import { createClientSupabase } from '@/lib/supabase'
import { useSidebar } from '@/components/providers/SidebarContext'
import { useToast } from '@/components/providers/ToastProvider'

interface TopBarProps {
  businessName?: string
  initials?: string
  planStatus?: string | null
  trialDays?: number
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  created_at: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function notifIcon(type: string) {
  switch (type) {
    case 'hot_lead': return <Zap size={13} style={{ color: '#f97316' }} />
    case 'escalation': return <AlertTriangle size={13} style={{ color: '#f87171' }} />
    case 'agent_error': return <Bot size={13} style={{ color: '#f87171' }} />
    case 'payment_received': return <CreditCard size={13} style={{ color: '#4ade80' }} />
    case 'trial_expiring': return <Clock size={13} style={{ color: '#fbbf24' }} />
    case 'new_conversation': return <MessageCircle size={13} style={{ color: '#C9A84C' }} />
    default: return <Bell size={13} style={{ color: '#6b6b6b' }} />
  }
}

export function DashboardTopBar({ businessName: bProp, initials: iProp, planStatus: psProp, trialDays: tdProp }: TopBarProps) {
  const router = useRouter()
  const { toggle } = useSidebar()
  const { toast } = useToast()

  const [businessName, setBusinessName] = useState(bProp ?? '')
  const [initials, setInitials] = useState(iProp ?? '…')
  const [planStatus, setPlanStatus] = useState(psProp ?? null)
  const [trialDays, setTrialDays] = useState(tdProp ?? 0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifOpen, setNotifOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // If props not provided (client-side pages), fetch from /api/me
  useEffect(() => {
    if (bProp) return
    fetch('/api/me')
      .then(r => r.json())
      .then(j => {
        if (j.data) {
          setBusinessName(j.data.businessName)
          setInitials(j.data.initials)
          setPlanStatus(j.data.planStatus)
          setTrialDays(j.data.trialDays)
        }
      })
      .catch(() => {})
  }, [bProp])

  const fetchNotifications = useCallback(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(j => { if (j.data?.notifications) setNotifications(j.data.notifications) })
      .catch(() => {})
  }, [])

  // Poll notifications every 30s
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    setDropdownOpen(false)
    try {
      const supabase = createClientSupabase()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch {
      toast('Logout failed — please try again', 'error')
      setLoggingOut(false)
    }
  }

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' })
    setNotifications([])
  }

  async function markOneRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const unreadCount = notifications.length

  const planLabel = planStatus === 'trialing'
    ? `Free Trial · ${trialDays}d`
    : planStatus === 'active'
    ? 'Active'
    : planStatus ?? 'Free'

  return (
    <header
      className="sticky top-0 z-30 flex items-center px-4 lg:px-6 gap-4 shrink-0 relative"
      style={{ height: '60px', background: '#141414', borderBottom: '1px solid #2a2a2a' }}
    >
      {/* Futuristic decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div
          className="absolute top-0 bottom-0 w-40"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.08) 40%, rgba(201,168,76,0.18) 50%, rgba(201,168,76,0.08) 60%, transparent)', animation: 'scanline 5s ease-in-out infinite', left: '-160px' }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4) 30%, rgba(201,168,76,0.7) 50%, rgba(201,168,76,0.4) 70%, transparent)' }} />
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.15) 50%, transparent)' }} />
        <svg className="absolute right-0 top-0 h-full w-80 opacity-[0.08]" viewBox="0 0 320 60" preserveAspectRatio="xMaxYMid slice">
          {Array.from({ length: 8 }, (_, row) =>
            Array.from({ length: 22 }, (_, col) => (
              <circle key={`${row}-${col}`} cx={col * 16 + 8} cy={row * 8 + 4} r="1" fill="#C9A84C" />
            ))
          )}
        </svg>
        <svg className="absolute right-72 top-0 h-full w-20 opacity-20" viewBox="0 0 80 60" preserveAspectRatio="none">
          <line x1="80" y1="0" x2="0" y2="60" stroke="#C9A84C" strokeWidth="0.5"/>
          <line x1="60" y1="0" x2="0" y2="45" stroke="#C9A84C" strokeWidth="0.3"/>
        </svg>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1.5 opacity-20">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#4ade80' }} />
          <span className="text-[9px] font-sans uppercase tracking-[0.4em]" style={{ color: '#4ade80' }}>LIVE</span>
        </div>
      </div>

      {/* Hamburger — mobile only */}
      <button
        className="lg:hidden flex items-center justify-center transition-colors"
        style={{ color: '#6b6b6b' }}
        onClick={toggle}
        aria-label="Toggle sidebar"
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#C9A84C')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#6b6b6b')}
      >
        <Menu size={20} />
      </button>

      {/* Logo mark (desktop) */}
      <div className="hidden lg:flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="46" stroke="#C9A84C" strokeWidth="0.5" opacity="0.35"/>
          <circle cx="50" cy="50" r="4" fill="#C9A84C" opacity="0.9"/>
          <line x1="50" y1="46" x2="50" y2="8"  stroke="#C9A84C" strokeWidth="1"/>
          <line x1="53" y1="48" x2="83" y2="27" stroke="#C9A84C" strokeWidth="1"/>
          <line x1="53" y1="52" x2="83" y2="73" stroke="#C9A84C" strokeWidth="1"/>
          <line x1="50" y1="54" x2="50" y2="92" stroke="#C9A84C" strokeWidth="1"/>
          <line x1="47" y1="52" x2="17" y2="73" stroke="#C9A84C" strokeWidth="1"/>
          <line x1="47" y1="48" x2="17" y2="27" stroke="#C9A84C" strokeWidth="1"/>
        </svg>
      </div>

      {/* Center: Business name */}
      <div className="flex-1 flex justify-center">
        <span className="font-sans text-sm tracking-wide truncate max-w-[200px]" style={{ color: '#F0EBE1' }}>
          {businessName || '\u00A0'}
        </span>
      </div>

      {/* Right: icons + avatar */}
      <div className="flex items-center gap-3 lg:gap-4">
        <button
          className="transition-colors hidden sm:block"
          style={{ color: '#6b6b6b' }}
          title="Language — EN"
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#C9A84C')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#6b6b6b')}
        >
          <Globe size={18} />
        </button>

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            className="relative transition-colors"
            style={{ color: unreadCount > 0 ? '#C9A84C' : '#6b6b6b' }}
            title="Notifications"
            onClick={() => setNotifOpen(v => !v)}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#C9A84C')}
            onMouseLeave={e => { if (unreadCount === 0) (e.currentTarget as HTMLElement).style.color = '#6b6b6b' }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold font-sans"
                style={{ background: '#C9A84C', color: '#070707' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl overflow-hidden z-50"
              style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #2a2a2a' }}>
                <span className="text-xs font-sans font-semibold uppercase tracking-widest" style={{ color: '#C9A84C' }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs font-sans transition-colors"
                    style={{ color: '#6b6b6b' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#F0EBE1')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#6b6b6b')}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell size={20} className="mx-auto mb-2" style={{ color: '#2a2a2a' }} />
                    <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>No new notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map(n => (
                    <div key={n.id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                      <Link
                        href={n.link ?? '/dashboard'}
                        onClick={() => { markOneRead(n.id); setNotifOpen(false) }}
                        className="flex items-start gap-3 px-4 py-3 transition-colors block"
                        style={{ textDecoration: 'none' }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.04)')}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                      >
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
                          {notifIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-sans font-semibold" style={{ color: '#F0EBE1' }}>{n.title}</p>
                          <p className="text-xs font-sans mt-0.5 truncate" style={{ color: '#6b6b6b' }}>{n.message}</p>
                          <p className="text-[10px] font-sans mt-1" style={{ color: '#4a4a4a' }}>{timeAgo(n.created_at)}</p>
                        </div>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
            aria-label="Account menu"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: 'rgba(201,168,76,0.12)',
                border: '1px solid rgba(201,168,76,0.3)',
                color: '#C9A84C',
              }}
            >
              {initials}
            </div>
            <ChevronDown
              size={14}
              className="hidden sm:block transition-transform"
              style={{
                color: '#6b6b6b',
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-lg shadow-2xl overflow-hidden z-50"
              style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
            >
              {/* Identity */}
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #2a2a2a' }}>
                <p className="text-sm font-sans font-medium truncate" style={{ color: '#F0EBE1' }}>
                  {businessName || 'Your Business'}
                </p>
                <span
                  className="inline-block mt-1 text-xs font-sans px-1.5 py-0.5 rounded"
                  style={{
                    background: 'rgba(201,168,76,0.1)',
                    color: '#C9A84C',
                    border: '1px solid rgba(201,168,76,0.2)',
                  }}
                >
                  {planLabel}
                </span>
              </div>

              {/* Actions */}
              <div className="py-1">
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-sans transition-colors text-left"
                  style={{ color: '#6b6b6b' }}
                  onClick={() => { setDropdownOpen(false); router.push('/dashboard/settings') }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#F0EBE1')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#6b6b6b')}
                >
                  <Settings size={14} />
                  Settings
                </button>

                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-sans transition-colors text-left"
                  style={{ color: loggingOut ? '#6b6b6b' : '#f87171' }}
                  disabled={loggingOut}
                  onClick={handleLogout}
                  onMouseEnter={e => { if (!loggingOut) (e.currentTarget as HTMLElement).style.color = '#fca5a5' }}
                  onMouseLeave={e => { if (!loggingOut) (e.currentTarget as HTMLElement).style.color = '#f87171' }}
                >
                  <LogOut size={14} />
                  {loggingOut ? 'Signing out…' : 'Sign Out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
