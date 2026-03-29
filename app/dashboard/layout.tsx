import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'
import { SidebarProvider } from '@/components/providers/SidebarContext'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabase()
  // Use getUser() for server-validated authentication — not getSession() (cookie-only, no server check)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Update last_login_at on every dashboard load
  const admin = createAdminClient()
  await admin
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', user.id)

  return (
    <SidebarProvider>
      <div style={{ background: '#070707', minHeight: '100vh' }}>
        {children}
      </div>
    </SidebarProvider>
  )
}
