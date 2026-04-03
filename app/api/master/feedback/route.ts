import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (request.headers.get('x-master-secret') !== process.env.MASTER_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: feedback, error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('feedback')
    .select('*, tenants(business_name, business_email), users(full_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const stats = {
    total: feedback?.length ?? 0,
    by_type: {} as Record<string, number>,
    by_status: {} as Record<string, number>,
    avg_rating: 0,
  }

  if (feedback) {
    let ratingSum = 0
    let ratingCount = 0
    for (const f of feedback as Array<Record<string, unknown>>) {
      const fType = f.type as string
      const fStatus = f.status as string
      stats.by_type[fType] = (stats.by_type[fType] ?? 0) + 1
      stats.by_status[fStatus] = (stats.by_status[fStatus] ?? 0) + 1
      if (f.rating) {
        ratingSum += f.rating as number
        ratingCount++
      }
    }
    stats.avg_rating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0
  }

  return Response.json({ ok: true, data: feedback, stats })
}
