import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { injectIntelligence } from '@/lib/orion/orion-engine'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// MCP discovery
export async function GET() {
  const { data: agents } = await supabaseAdmin
    .from('marketplace_agents')
    .select('agent_type, display_name, description')
    .eq('status', 'active')
    .limit(50)

  const tools: object[] = (agents || []).map(a => ({
    name: `lycho_${a.agent_type}`,
    description: a.description || `LYCHO ${a.display_name} specialist agent`,
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Message to send to this agent' },
        context: { type: 'string', description: 'Optional context' },
      },
      required: ['message'],
    },
  }))

  tools.unshift(
    {
      name: 'lycho_ask',
      description: 'Ask any LYCHO specialist agent. Provide agent_type to route to a specific specialist.',
      inputSchema: {
        type: 'object',
        properties: {
          message:    { type: 'string', description: 'Your question or task' },
          agent_type: { type: 'string', description: 'e.g. research, compliance, legal_intake' },
          context:    { type: 'string', description: 'Optional business context' },
        },
        required: ['message'],
      },
    },
    {
      name: 'lycho_research',
      description: 'Deep research on any topic using LYCHO Research Agent with live web search',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Research query' } },
        required: ['query'],
      },
    },
    {
      name: 'lycho_comply',
      description: 'Check compliance, regulations, legal requirements for any business situation',
      inputSchema: {
        type: 'object',
        properties: {
          situation: { type: 'string', description: 'Business situation to check' },
          country:   { type: 'string', description: 'Country code e.g. PK, AE, GB' },
        },
        required: ['situation'],
      },
    },
  )

  return NextResponse.json({
    name: 'lycho',
    version: '1.0.0',
    description: 'LYCHO — Universal AI Business Platform. 370+ specialist agents across 20 sectors.',
    tools,
  })
}

// MCP tool execution
export async function POST(request: Request) {
  try {
    const { tool, input, api_key } = await request.json()

    if (!api_key) return NextResponse.json({ error: 'api_key required' }, { status: 401 })

    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('id, plan_status')
      .eq('api_key', api_key)
      .single()

    if (!tenant) return NextResponse.json({ error: 'Invalid api_key' }, { status: 401 })

    let agentType = 'research'
    if (tool === 'lycho_research') agentType = 'research'
    else if (tool === 'lycho_comply') agentType = 'compliance'
    else if (tool === 'lycho_ask' && input?.agent_type) agentType = input.agent_type
    else if (typeof tool === 'string' && tool.startsWith('lycho_')) agentType = tool.replace('lycho_', '')

    const systemPrompt = await injectIntelligence(agentType, input?.country || 'PK')

    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey: process.env.OPENCODE_API_KEY || 'sk-DkKhm5mvzbJQHPhVyAbDBKVbDQgKuq5e6bTxTHW9jcRHa50tW3P9ax4oEsDv3buu', baseURL: 'https://opencode.ai/zen/v1' })

    const userMessage = input?.message || input?.query || input?.situation || JSON.stringify(input)

    const response = await openai.chat.completions.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    })

    const text = response.choices[0]?.message?.content || ''

    return NextResponse.json({ content: [{ type: 'text', text }], tool_used: agentType })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
