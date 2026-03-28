// Server-only Supabase client — do NOT import this in client components.
// Uses next/headers which is only available in server context.
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createServerSupabase() {
  const cookieStore = cookies()
  return createServerClient<Database>(supabaseUrl, supabaseAnon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set(name: string, value: string, options: any) {
        try { cookieStore.set(name, value, options) } catch {}
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      remove(name: string, options: any) {
        try { cookieStore.set(name, '', options) } catch {}
      },
    },
  })
}
