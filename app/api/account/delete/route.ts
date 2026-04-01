import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { createAdminClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function DELETE() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set() {},
        remove() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Get tenant_id
  const { data: userRow } = await admin.from('users').select('tenant_id').eq('id', user.id).single()

  if (userRow?.tenant_id) {
    // Soft-delete tenant and all agents
    await admin.from('agents').update({ status: 'deleted' }).eq('tenant_id', userRow.tenant_id)
    await admin.from('tenants').update({ deleted_at: new Date().toISOString() }).eq('id', userRow.tenant_id)
  }

  // Delete auth user (removes all sessions too)
  await admin.auth.admin.deleteUser(user.id)

  return NextResponse.json({ success: true })
}
