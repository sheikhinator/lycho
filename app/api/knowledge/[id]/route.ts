import { getAuthContext, ok, err } from '@/lib/api'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// DELETE /api/knowledge/[id] — delete all chunks for a document (by name lookup)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant', 'NO_TENANT', 403)

  const { tenantId } = ctx
  const { id } = await params

  // Find name of this chunk, then delete all chunks with that name
  const { data: doc } = await supabaseAdmin
    .from('knowledge_documents')
    .select('name')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!doc) return err('Document not found', 'NOT_FOUND', 404)

  const { error } = await supabaseAdmin
    .from('knowledge_documents')
    .delete()
    .eq('name', doc.name)
    .eq('tenant_id', tenantId)

  if (error) return err(error.message, 'DB_ERROR', 500)
  return ok({ deleted: true })
}
