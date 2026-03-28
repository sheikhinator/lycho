import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ─── Client-side (use inside 'use client' components) ────────────────────────
// Respects RLS. Safe for the browser.
export function createClientSupabase() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnon)
}

// ─── Server Components & Route Handlers ──────────────────────────────────────
// Reads the session cookie automatically. Use in async server components and
// route handlers (pass the result of `cookies()` from next/headers).
export function createServerSupabase() {
  return createServerClient<Database>(supabaseUrl, supabaseAnon, {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value
      },
    },
  })
}

// ─── Service-role / Admin client ─────────────────────────────────────────────
// Bypasses RLS entirely. NEVER import this in client components or expose
// to the browser. Only use in server-side code (API routes, scripts, jobs).
export function createAdminClient() {
  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
