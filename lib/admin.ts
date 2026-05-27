import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

let _admin: ReturnType<typeof createClient<Database>> | null = null

export function admin(): ReturnType<typeof createClient<Database>> {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
    if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
    _admin = createClient<Database>(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return _admin
}
