import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from './database.types'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ─── Browser client (safe in 'use client' components) ────────────────────────
export function createClientSupabase() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnon)
}

// ─── Service-role / Admin client ─────────────────────────────────────────────
// Bypasses RLS. Server-side only — never call from client components.
export function createAdminClient() {
  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
