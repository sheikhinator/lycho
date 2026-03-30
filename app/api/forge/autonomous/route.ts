import { NextRequest } from 'next/server'
import { ok, err, rateGuard, AUTH_LIMITS } from '@/lib/api'
import { createAdminClient } from '@/lib/supabase'
import { runAutonomousForge } from '@/lib/forge/forge-scheduler'

function checkMasterSecret(req: NextRequest): boolean {
  const secret = process.env.MASTER_SECRET
  if (!secret) return false
  return req.headers.get('x-master-secret') === secret
}

// GET /api/forge/autonomous — Vercel cron job endpoint
export async function GET(req: NextRequest) {
  const rl = await rateGuard(req, AUTH_LIMITS)
  if (rl) return rl

  if (!checkMasterSecret(req)) return err('Forbidden', 'FORBIDDEN', 403)

  const adminClient = createAdminClient()
  const result = await runAutonomousForge(adminClient)
  return ok(result, `Forge run complete — ${result.agents_queued} agent(s) queued`)
}

// POST /api/forge/autonomous — manual trigger
export async function POST(req: NextRequest) {
  const rl = await rateGuard(req, AUTH_LIMITS)
  if (rl) return rl

  if (!checkMasterSecret(req)) return err('Forbidden', 'FORBIDDEN', 403)

  const adminClient = createAdminClient()
  const result = await runAutonomousForge(adminClient)
  return ok(result, `Forge run complete — ${result.agents_queued} agent(s) queued`)
}
