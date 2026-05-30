import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { createBackup, listBackups, restoreBackup, deleteBackup } from '@/lib/backup/backup-engine'

export const dynamic = 'force-dynamic'

export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const backups = await listBackups(ctx.tenantId)
    return NextResponse.json({ backups })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { action } = body

    if (action === 'create') {
      const backup = await createBackup(ctx.tenantId, body.label || `Backup ${new Date().toLocaleDateString()}`, body.type || 'full')
      return NextResponse.json(backup)
    }

    if (action === 'restore') {
      const result = await restoreBackup(ctx.tenantId, body.backupId)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    await deleteBackup(id)
    return NextResponse.json({ success: true })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
