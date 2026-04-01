import { createAdminClient } from '@/lib/supabase'
import { ok } from '@/lib/api'

// GET /api/waitlist/leaderboard — top 5 referrers (anonymized)
export async function GET() {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('waitlist')
    .select('position, referral_count')
    .gt('referral_count', 0)
    .order('referral_count', { ascending: false })
    .limit(5)

  return ok(data ?? [])
}
