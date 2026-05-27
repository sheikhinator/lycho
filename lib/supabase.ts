import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from './database.types'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required.`)
  }
  return value
}

// ─── Browser client (safe in 'use client' components) ────────────────────────
export function createClientSupabase() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnon = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return createBrowserClient<Database>(supabaseUrl, supabaseAnon)
}

// ─── Service-role / Admin client ─────────────────────────────────────────────
// Bypasses RLS. Server-side only — never call from client components.
export function createAdminClient() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
