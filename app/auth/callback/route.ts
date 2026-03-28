import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          set(name: string, value: string, options: any) {
            try { cookieStore.set(name, value, options) } catch {}
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          remove(name: string, options: any) {
            try { cookieStore.set(name, '', options) } catch {}
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if the user needs to complete onboarding
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: userRow } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

          if (userRow?.tenant_id) {
            const { data: tenant } = await supabase
              .from('tenants')
              .select('onboarding_completed')
              .eq('id', userRow.tenant_id)
              .single()

            if (tenant && tenant.onboarding_completed === false) {
              return NextResponse.redirect(`${origin}/onboarding`)
            }
          }
        }
      } catch {
        // If check fails, proceed normally
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
