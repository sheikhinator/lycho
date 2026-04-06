import { NextRequest } from 'next/server'
import { getAuthContext, ok, err } from '@/lib/api'
import { ingestDocument } from '@/lib/knowledge/knowledge-engine'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// GET /api/knowledge — list documents for tenant (grouped by name)
export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant', 'NO_TENANT', 403)

  const { tenantId } = ctx

  const { data, error } = await supabaseAdmin
    .from('knowledge_documents')
    .select('id, name, source_type, source_url, chunk_index, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) return err(error.message, 'DB_ERROR', 500)

  // Group by name
  const grouped: Record<string, { id: string; name: string; source_type: string; source_url: string | null; chunks: number; created_at: string }> = {}
  for (const row of data ?? []) {
    if (!grouped[row.name]) {
      grouped[row.name] = {
        id: row.id,
        name: row.name,
        source_type: row.source_type,
        source_url: row.source_url,
        chunks: 0,
        created_at: row.created_at,
      }
    }
    grouped[row.name].chunks++
  }

  return ok({ documents: Object.values(grouped) })
}

// POST /api/knowledge — ingest a document
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant', 'NO_TENANT', 403)

  const { tenantId } = ctx

  let body: { name: string; content: string; source_type?: string; source_url?: string }
  try { body = await req.json() } catch { return err('Invalid JSON', 'INVALID_BODY', 400) }

  if (!body.name?.trim()) return err('name is required', 'VALIDATION_ERROR', 400)
  if (!body.content?.trim()) return err('content is required', 'VALIDATION_ERROR', 400)

  const result = await ingestDocument(
    tenantId,
    body.name.trim(),
    body.content.trim(),
    (body.source_type as 'upload' | 'url') || 'upload',
    body.source_url
  )

  return ok({ chunks: result.chunks })
}
