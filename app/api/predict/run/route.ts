import { NextResponse } from 'next/server'
import { detectColdLeads, detectChurnRisk, detectInactiveAgents } from '@/lib/predict/predict-engine'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const secret = request.headers.get('x-master-secret') ??
    new URL(request.url).searchParams.get('secret')

  if (secret !== process.env.MASTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [coldLeads, churnRisk, inactiveAgents] = await Promise.all([
    detectColdLeads(),
    detectChurnRisk(),
    detectInactiveAgents(),
  ])

  return NextResponse.json({
    ok: true,
    cold_leads_flagged:      coldLeads,
    churn_risks_flagged:     churnRisk,
    inactive_agents_flagged: inactiveAgents,
  })
}
