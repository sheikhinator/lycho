import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { createPortal, listPortals } from '@/lib/portal/portal-engine'

export const dynamic = 'force-dynamic'

export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const portals = await listPortals(ctx.tenantId)
    return NextResponse.json({ portals })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { name, subdomain, agentTypes } = await req.json()
    if (!name || !subdomain) return NextResponse.json({ error: 'name and subdomain are required' }, { status: 400 })
    const portal = await createPortal(ctx.tenantId, { name, subdomain, agentTypes: agentTypes || [] })
    return NextResponse.json(portal)
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
