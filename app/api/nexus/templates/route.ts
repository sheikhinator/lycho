import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('nexus_queue')
    .select('template_id, name, description, category, sector_tags, trigger, steps, use_case_examples')
    .eq('status', 'approved')
    .order('reviewed_at', { ascending: false })

  return NextResponse.json({ templates: data || [] })
}
