import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { createEndpoint, listEndpoints, updateEndpoint, deleteEndpoint, WEBHOOK_EVENTS } from '@/lib/webhooks/webhook-engine'

export const dynamic = 'force-dynamic'

export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const endpoints = await listEndpoints(ctx.tenantId)
    return NextResponse.json({ endpoints, available_events: WEBHOOK_EVENTS })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    if (!body.url || !body.events?.length) return NextResponse.json({ error: 'url and events are required' }, { status: 400 })
    const endpoint = await createEndpoint(ctx.tenantId, body)
    return NextResponse.json({ endpoint, warning: 'Save the secret — it will not be shown again.' })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    await updateEndpoint(id, updates)
    return NextResponse.json({ success: true })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    await deleteEndpoint(id)
    return NextResponse.json({ success: true })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
