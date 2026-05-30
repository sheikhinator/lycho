import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { addTrainingExample, getTrainingExamples } from '@/lib/training/training-engine'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(req.url)
    const agentType = searchParams.get('agent_type')
    const category = searchParams.get('category')
    if (!agentType) return NextResponse.json({ error: 'agent_type is required' }, { status: 400 })
    const examples = await getTrainingExamples(agentType, category || undefined)
    return NextResponse.json({ examples })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    await addTrainingExample(body)
    return NextResponse.json({ success: true })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
