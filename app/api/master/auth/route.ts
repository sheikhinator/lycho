import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { password } = await request.json()
  if (password === process.env.MASTER_SECRET) {
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
}
