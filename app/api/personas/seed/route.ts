import { NextResponse } from 'next/server'
import { seedPersonas } from '@/lib/persona/persona-engine'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const secret = request.headers.get('x-master-secret')
  if (secret !== process.env.MASTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await seedPersonas()
  return NextResponse.json({ ok: true, seeded: true })
}
