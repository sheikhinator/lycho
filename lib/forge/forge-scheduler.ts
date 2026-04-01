import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ForgeAgent = Record<string, any>

export async function runAutonomousForge(): Promise<{ agents_queued: number }> {
  console.log('=== FORGE STARTING ===', new Date().toISOString())

  try {
    // Get existing types to avoid duplicates
    const { data: existing } = await supabaseAdmin
      .from('forge_queue')
      .select('agent_type')
      .not('status', 'eq', 'rejected')

    const existingTypes: string[] = existing?.map((e: ForgeAgent) => e.agent_type) || []
    console.log('Existing types count:', existingTypes.length)

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `Generate 5 new AI agent ideas for LYCHO, a business automation platform.

Date: ${new Date().toISOString().split('T')[0]}
Skip these existing types: ${existingTypes.slice(0, 30).join(', ') || 'none'}

Focus on Pakistani and GCC business needs. Each agent must solve a real business problem.

Respond with ONLY this JSON array, nothing else before or after:

[
  {
    "agent_type": "invoice_followup_agent",
    "display_name": "Invoice Follow-up Agent",
    "description": "Automatically follows up on unpaid invoices via WhatsApp and email",
    "system_prompt": "You are an Invoice Follow-up Agent for LYCHO. Your role is to professionally follow up on unpaid invoices on behalf of businesses. You maintain a polite but firm tone, track payment promises, and escalate when needed. You support all languages. Human Sovereignty: always escalate disputes to human staff. METADATA: extract {contact_name, invoice_amount, due_date, payment_status}",
    "recommended_channels": ["whatsapp", "email"],
    "model_complexity": "simple",
    "estimated_value_pkr": 35000,
    "sector_tags": ["finance", "general"],
    "use_case_examples": [
      "Remind client about PKR 50,000 invoice due last week",
      "Send payment confirmation and receipt",
      "Escalate overdue invoice to human manager"
    ],
    "why_novel": "No Pakistani platform automates invoice follow-up in Urdu and English"
  }
]

Now generate 5 agents following this exact format. Return ONLY the JSON array.`

    console.log('Calling Claude...')
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    console.log('Claude response length:', rawText.length)
    console.log('Claude response preview:', rawText.substring(0, 200))

    if (!rawText || rawText.length < 10) {
      throw new Error('Claude returned empty response')
    }

    // Multiple extraction strategies
    let agents: ForgeAgent[] = []

    // Strategy 1: Direct parse
    try {
      agents = JSON.parse(rawText.trim())
      console.log('Strategy 1 success — direct parse')
    } catch {
      // Strategy 2: Extract array with regex
      try {
        const match = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/)
        if (match) {
          agents = JSON.parse(match[0])
          console.log('Strategy 2 success — regex extract')
        } else {
          throw new Error('No match')
        }
      } catch {
        // Strategy 3: Find first [ to last ]
        try {
          const start = rawText.indexOf('[')
          const end = rawText.lastIndexOf(']')
          if (start !== -1 && end !== -1 && end > start) {
            agents = JSON.parse(rawText.substring(start, end + 1))
            console.log('Strategy 3 success — bracket extract')
          } else {
            throw new Error('No brackets found')
          }
        } catch (e) {
          console.error('All parse strategies failed:', e)
          console.error('Full raw text:', rawText)
          throw new Error(`JSON parse failed after 3 strategies. Raw: ${rawText.substring(0, 500)}`)
        }
      }
    }

    console.log('Parsed agents count:', agents.length)

    if (!Array.isArray(agents) || agents.length === 0) {
      throw new Error('No agents array found in response')
    }

    // Filter duplicates and invalid entries
    const novel = agents.filter((a: ForgeAgent) => {
      if (!a.agent_type || !a.display_name) {
        console.log('Skipping invalid agent:', a)
        return false
      }
      if (existingTypes.includes(a.agent_type)) {
        console.log('Skipping duplicate:', a.agent_type)
        return false
      }
      return true
    })

    console.log('Novel agents after filter:', novel.length)

    if (novel.length === 0) {
      console.log('All agents were duplicates — returning 0')
      return { agents_queued: 0 }
    }

    // Insert one by one to catch individual errors
    let inserted = 0
    for (const agent of novel) {
      try {
        const { error } = await supabaseAdmin.from('forge_queue').insert({
          agent_type:           agent.agent_type,
          display_name:         agent.display_name,
          description:          agent.description || '',
          system_prompt:        agent.system_prompt || '',
          recommended_channels: agent.recommended_channels || ['web'],
          model_complexity:     agent.model_complexity || 'simple',
          estimated_value_pkr:  Number(agent.estimated_value_pkr) || 0,
          sector_tags:          agent.sector_tags || [],
          use_case_examples:    agent.use_case_examples || [],
          why_novel:            agent.why_novel || '',
          status:               'pending_review',
          source:               'autonomous',
          created_at:           new Date().toISOString(),
        })
        if (error) {
          console.error('Insert error for', agent.agent_type, ':', error.message)
        } else {
          inserted++
          console.log('Inserted:', agent.agent_type)
        }
      } catch (e: unknown) {
        const err = e as { message?: string }
        console.error('Insert exception for', agent.agent_type, ':', err.message)
      }
    }

    console.log('Total inserted:', inserted)

    // Send email notification
    if (inserted > 0 && process.env.MASTER_EMAIL && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'LYCHO Forge <onboarding@resend.dev>',
          to: process.env.MASTER_EMAIL,
          subject: `${inserted} new agents ready for review`,
          html: `<p>Forge built <strong>${inserted} new agents</strong>. <a href="${process.env.NEXT_PUBLIC_APP_URL}/master">Review in Master Panel →</a></p>`,
        })
      } catch (e) {
        console.error('Email notification failed:', e)
      }
    }

    return { agents_queued: inserted }

  } catch (error: unknown) {
    const e = error as { message?: string }
    console.error('=== FORGE FATAL ERROR ===', e.message)
    throw error
  }
}
