import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { createABTest, listABTests } from '@/lib/abtesting/abtest-engine'

export const dynamic = 'force-dynamic'

export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const tests = await listABTests(ctx.tenantId)
    return NextResponse.json({ tests })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    if (!body.name || !body.agent_type || !body.variants?.length) {
      return NextResponse.json({ error: 'name, agent_type, and variants are required' }, { status: 400 })
    }
    const test = await createABTest(ctx.tenantId, body)
    return NextResponse.json(test)
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
