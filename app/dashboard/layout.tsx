import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  // Dead-man's switch — update last_login_at on every dashboard load
  const admin = createAdminClient()
  await admin
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', session.user.id)

  return (
    <div style={{ background: '#070707', minHeight: '100vh' }}>
      {children}
    </div>
  )
}
