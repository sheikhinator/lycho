import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    status: 'operational',
    platform: 'LYCHO',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    services: {
      agents: 'operational',
      memory: 'operational',
      knowledge: 'operational',
      voice: 'operational',
      search: 'operational',
      society: 'operational'
    }
  })
}
