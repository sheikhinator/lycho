import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { createWorkspace, listWorkspaces, updateWorkspace, deleteWorkspace } from '@/lib/collab/collab-engine'

export const dynamic = 'force-dynamic'

export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const workspaces = await listWorkspaces(ctx.tenantId)
    return NextResponse.json({ workspaces })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { name, description } = await req.json()
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
    const workspace = await createWorkspace(ctx.tenantId, name, description)
    return NextResponse.json(workspace)
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, name, description } = await req.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    await updateWorkspace(id, { name, description })
    return NextResponse.json({ success: true })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    await deleteWorkspace(id)
    return NextResponse.json({ success: true })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
