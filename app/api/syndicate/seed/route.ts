import { NextRequest, NextResponse } from 'next/server'
import { seedSyndicateRoutes, seedAgentRegistry } from '@/lib/syndicate/syndicate'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-master-secret')
  if (!secret || secret !== process.env.MASTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [routes, agents] = await Promise.all([
    seedSyndicateRoutes(),
    seedAgentRegistry()
  ])

  return NextResponse.json({
    success: true,
    routes_seeded: routes.seeded,
    agents_seeded: agents.seeded
  })
}
