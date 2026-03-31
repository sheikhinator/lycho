import { NextRequest } from 'next/server'
import { getAuthContext, ok, err } from '@/lib/api'
import { createAdminClient } from '@/lib/supabase'

// GET /api/marketplace/agents — auth required, returns marketplace_agents table
export async function GET(_req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('marketplace_agents')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) return err(error.message, 'DB_ERROR', 500)
  return ok({ agents: data || [] })
}
