import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'
import { SidebarProvider } from '@/components/providers/SidebarContext'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const headersList = await headers()
  const currentPath = headersList.get('x-current-path') ?? ''

  const { data: userRow } = await admin
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (userRow?.tenant_id && currentPath !== '/dashboard/activate') {
    const { data: tenant } = await admin
      .from('tenants')
      .select('plan_status, business_email')
      .eq('id', userRow.tenant_id)
      .single()

    const planStatus = tenant?.plan_status
    const masterEmail = process.env.MASTER_EMAIL
    const isMaster = masterEmail && tenant?.business_email === masterEmail
    // Enterprise accounts and master email bypass all paywall checks
    if (!isMaster && planStatus !== 'enterprise' && (planStatus === 'pending' || planStatus === 'expired')) {
      redirect('/dashboard/activate')
    }
  }

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
