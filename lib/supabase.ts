import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from './database.types'

// ─── Browser client (safe in 'use client' components) ────────────────────────
export function createClientSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required.')
  if (!supabaseAnon) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required.')
  return createBrowserClient<Database>(supabaseUrl, supabaseAnon)
}

// ─── Service-role / Admin client ─────────────────────────────────────────────
// Bypasses RLS. Server-side only — never call from client components.
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required.')
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required.')
  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
