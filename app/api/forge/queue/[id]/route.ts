import { NextRequest } from 'next/server'
import { ok, err } from '@/lib/api'
import { createAdminClient } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function checkMasterSecret(req: NextRequest): boolean {
  const secret = process.env.MASTER_SECRET
  if (!secret) return false
  return req.headers.get('x-master-secret') === secret
}

// PUT /api/forge/queue/[id] — approve or reject a queued agent
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!checkMasterSecret(req)) return err('Forbidden', 'FORBIDDEN', 403)

  let body: { action: 'approve' | 'reject'; notes?: string }
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 'INVALID_BODY', 400)
  }

  if (!body.action || !['approve', 'reject'].includes(body.action))
    return err('action must be "approve" or "reject"', 'VALIDATION_ERROR', 400)

  const adminClient = createAdminClient()
  const now = new Date().toISOString()

  // Fetch the queue entry (forge_queue not in generated types — use any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: entry, error: fetchErr } = await (adminClient as any)
    .from('forge_queue')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !entry) return err('Queue entry not found', 'NOT_FOUND', 404)

  if (body.action === 'reject') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminClient as any)
      .from('forge_queue')
      .update({ status: 'rejected', reviewed_at: now, master_notes: body.notes ?? null })
      .eq('id', id)

    if (error) return err(error.message, 'DB_ERROR', 500)
    return ok({ status: 'rejected' }, 'Agent rejected')
  }

  // APPROVE flow
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: queueErr } = await (adminClient as any)
    .from('forge_queue')
    .update({
      status:       'approved',
      reviewed_at:  now,
      deployed_at:  now,
      master_notes: body.notes ?? null,
    })
    .eq('id', id)

  if (queueErr) return err(queueErr.message, 'DB_ERROR', 500)

  // Register in Syndicate network
  try {
    const { registerAgent } = await import('@/lib/syndicate/syndicate')
    await registerAgent(entry.agent_type, entry.display_name, false)
  } catch { /* non-critical */ }

  // forge_queue status = 'approved' is the source of truth for marketplace
  // No separate table needed — marketplace API reads directly from forge_queue

  // Send confirmation email to master
  const masterEmail = process.env.MASTER_EMAIL
  if (masterEmail && process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: 'LYCHO Forge <onboarding@resend.dev>',
      to:   masterEmail,
      subject: `[LYCHO Forge] Agent approved & deployed: ${entry.display_name}`,
      html: `<h2>${entry.display_name} is live</h2>
<p><strong>Type:</strong> ${entry.agent_type}</p>
<p><strong>Description:</strong> ${entry.description}</p>
${body.notes ? `<p><strong>Your notes:</strong> ${body.notes}</p>` : ''}
<p>The agent has been added to the global catalogue and is now available to all tenants.</p>`,
    }).catch(() => {})
  }

  return ok({ status: 'approved' }, 'Agent approved and deployed')
}
