import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { inviteMember, listMembers, updateMemberRole, removeMember } from '@/lib/collab/collab-engine'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get('workspace_id')
    if (!workspaceId) return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    const members = await listMembers(workspaceId)
    return NextResponse.json({ members })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { workspaceId, email, role } = await req.json()
    if (!workspaceId || !email) return NextResponse.json({ error: 'workspaceId and email are required' }, { status: 400 })
    const member = await inviteMember(workspaceId, email, role)
    return NextResponse.json(member)
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { workspaceId, memberId, role } = await req.json()
    if (!workspaceId || !memberId || !role) return NextResponse.json({ error: 'workspaceId, memberId, role required' }, { status: 400 })
    await updateMemberRole(workspaceId, memberId, role)
    return NextResponse.json({ success: true })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { workspaceId, memberId } = await req.json()
    if (!workspaceId || !memberId) return NextResponse.json({ error: 'workspaceId and memberId required' }, { status: 400 })
    await removeMember(workspaceId, memberId)
    return NextResponse.json({ success: true })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
