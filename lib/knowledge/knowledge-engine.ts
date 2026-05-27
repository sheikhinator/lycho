import { createClient } from '@supabase/supabase-js'
import { getAIClient, MODELS } from '@/lib/ai'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required.`)
  return value
}

function getSupabaseAdmin() {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getAIClient()
  const response = await openai.embeddings.create({
    model: MODELS.embedding,
    input: text,
  })
  return response.data[0].embedding
}

function chunkText(text: string, chunkSize = 500): string[] {
  const sentences = text.split(/[.!?]+/)
  const chunks: string[] = []
  let current = ''

  for (const sentence of sentences) {
    if ((current + sentence).length > chunkSize && current) {
      chunks.push(current.trim())
      current = sentence
    } else {
      current += sentence + '. '
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks.filter(c => c.length > 50)
}

export async function ingestDocument(
  tenantId: string,
  name: string,
  content: string,
  sourceType: 'upload' | 'url' = 'upload',
  sourceUrl?: string
): Promise<{ chunks: number }> {
  const supabaseAdmin = getSupabaseAdmin()
  const chunks = chunkText(content)
  let inserted = 0

  for (let i = 0; i < chunks.length; i++) {
    try {
      const embedding = await generateEmbedding(chunks[i])
      await supabaseAdmin.from('knowledge_documents').insert({
        tenant_id: tenantId,
        name,
        content: chunks[i],
        source_type: sourceType,
        source_url: sourceUrl,
        chunk_index: i,
        embedding,
      })
      inserted++
    } catch (e) {
      console.error('Chunk insert error:', e)
    }
  }

  return { chunks: inserted }
}

export async function searchKnowledge(
  tenantId: string,
  query: string,
  limit = 3
): Promise<string> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const queryEmbedding = await generateEmbedding(query)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabaseAdmin as any).rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_tenant_id: tenantId,
      match_count: limit
    })

    if (!data?.length) return ''
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((d: any) => d.content).join('\n\n')
  } catch (e) {
    console.error('Knowledge search error:', e)
    return ''
  }
}
