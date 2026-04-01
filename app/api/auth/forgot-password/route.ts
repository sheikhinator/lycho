import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required.' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lycho.app'
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
    })

    if (error) {
      console.error('[forgot-password]', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const err = e as { message?: string }
    console.error('[forgot-password] error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
