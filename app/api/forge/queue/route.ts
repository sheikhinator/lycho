import { NextRequest } from 'next/server'
import { ok, err } from '@/lib/api'
import { createAdminClient } from '@/lib/supabase'

function checkMasterSecret(req: NextRequest): boolean {
  const secret = process.env.MASTER_SECRET
  if (!secret) return false
  return req.headers.get('x-master-secret') === secret
}

// GET /api/forge/queue — list all forge queue entries (master only)
export async function GET(req: NextRequest) {
  if (!checkMasterSecret(req)) return err('Forbidden', 'FORBIDDEN', 403)

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const adminClient = createAdminClient()
  let query = adminClient
    .from('forge_queue')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) return err(error.message, 'DB_ERROR', 500)
  return ok(data)
}
