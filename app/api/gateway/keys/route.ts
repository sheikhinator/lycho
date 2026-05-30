import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { generateApiKey, listApiKeys, revokeApiKey } from '@/lib/gateway/gateway-engine'

export const dynamic = 'force-dynamic'

export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const keys = await listApiKeys(ctx.tenantId)
    const safeKeys = keys.map(k => ({
      id: k.id,
      label: k.label,
      key_prefix: k.key_prefix,
      permissions: k.permissions,
      rate_limit_per_minute: k.rate_limit_per_minute,
      last_used_at: k.last_used_at,
      expires_at: k.expires_at,
      created_at: k.created_at,
      active: k.active,
    }))
    return NextResponse.json({ keys: safeKeys })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { label, permissions, rateLimitPerMinute, expiresInDays } = await req.json()
    if (!label) {
      return NextResponse.json({ error: 'Label is required' }, { status: 400 })
    }

    const result = await generateApiKey(
      ctx.tenantId,
      label,
      permissions,
      rateLimitPerMinute,
      expiresInDays
    )

    return NextResponse.json({
      key: result.key,
      key_prefix: result.keyPrefix,
      warning: 'Save this key — it will not be shown again.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { keyId } = await req.json()
    if (!keyId) {
      return NextResponse.json({ error: 'keyId is required' }, { status: 400 })
    }

    await revokeApiKey(keyId, ctx.tenantId)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
