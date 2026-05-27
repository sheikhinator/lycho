import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getAIClient } from '@/lib/ai'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const openai = getAIClient()

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── ORION TOOLS ──────────────────────────────────────────────────────────────

// ORION TOOLS
const orionTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'run_optimisation',
      description: 'Trigger ORION nightly optimisation now — rewrites underperforming agent prompts',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_agent_prompt',
      description: 'Directly rewrite the optimised prompt for a specific agent type',
      parameters: {
        type: 'object',
        properties: {
          agent_type: { type: 'string', description: 'The agent type slug' },
          new_prompt: { type: 'string', description: 'The new system prompt to set' },
          reason: { type: 'string', description: 'Why this change is being made' }
        },
        required: ['agent_type', 'new_prompt', 'reason']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'boost_agent_score',
      description: 'Manually set the intelligence score for an agent',
      parameters: {
        type: 'object',
        properties: {
          agent_type: { type: 'string' },
          score: { type: 'number', description: '0-100' },
          reason: { type: 'string' }
        },
        required: ['agent_type', 'score', 'reason']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_agent_intelligence',
      description: 'Fetch full intelligence data for a specific agent type',
      parameters: {
        type: 'object',
        properties: { agent_type: { type: 'string' } },
        required: ['agent_type']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'seed_countries',
      description: 'Re-seed all country profiles into the database',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'initialize_core_agents',
      description: 'Initialize all 7 core agent types (intake, research, operations, client, analyst, compliance, content) in the Orion intelligence store with optimised prompts',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'apply_geo_to_tenant',
      description: 'Apply geo-intelligence for a specific country to all agents of a tenant',
      parameters: {
        type: 'object',
        properties: {
          tenant_id: { type: 'string' },
          country_code: { type: 'string' }
        },
        required: ['tenant_id', 'country_code']
      }
    }
  }
]

// ── FORGE TOOLS ──────────────────────────────────────────────────────────────

const forgeTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'run_forge',
      description: 'Trigger Forge autonomous agent generation now',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_agent',
      description: 'Create and queue a specific agent with custom spec',
      parameters: {
        type: 'object',
        properties: {
          agent_type: { type: 'string', description: 'Slug e.g. insurance_claims_agent' },
          display_name: { type: 'string' },
          description: { type: 'string' },
          system_prompt: { type: 'string' },
          sector_tags: { type: 'array', items: { type: 'string' } },
          model_complexity: { type: 'string', enum: ['simple', 'complex'] },
          estimated_value_pkr: { type: 'number' },
          use_case_examples: { type: 'array', items: { type: 'string' } },
          why_novel: { type: 'string' }
        },
        required: ['agent_type', 'display_name', 'description', 'system_prompt']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'approve_agent',
      description: 'Approve a pending agent from the Forge queue and deploy it',
      parameters: {
        type: 'object',
        properties: { agent_id: { type: 'string', description: 'UUID of the forge_queue entry' } },
        required: ['agent_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'reject_agent',
      description: 'Reject a pending agent from the Forge queue',
      parameters: {
        type: 'object',
        properties: {
          agent_id: { type: 'string' },
          reason: { type: 'string' }
        },
        required: ['agent_id', 'reason']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_queue',
      description: 'List all agents currently in the Forge queue',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_agent_spec',
      description: 'Update an existing agent spec in the forge queue before approval',
      parameters: {
        type: 'object',
        properties: {
          agent_id: { type: 'string' },
          updates: { type: 'object', description: 'Fields to update: display_name, description, system_prompt, etc.' }
        },
        required: ['agent_id', 'updates']
      }
    }
  }
]

// ── SYNDICATE TOOLS ──────────────────────────────────────────────────────────

const syndicateTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'syndicate_transmit',
      description: 'Send a Syndicate message from one agent to another',
      parameters: {
        type: 'object',
        properties: {
          from_agent: { type: 'string' },
          to_agent: { type: 'string' },
          message_type: { type: 'string', description: 'e.g. request_analysis, share_intelligence, forge_brief, security_check' },
          message: { type: 'string', description: 'The message/payload content' }
        },
        required: ['from_agent', 'to_agent', 'message_type', 'message']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'syndicate_broadcast',
      description: 'Broadcast a message from one agent to multiple agents simultaneously',
      parameters: {
        type: 'object',
        properties: {
          from_agent: { type: 'string' },
          to_agents: { type: 'array', items: { type: 'string' }, description: 'Array of agent names' },
          message: { type: 'string' }
        },
        required: ['from_agent', 'to_agents', 'message']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_syndicate_messages',
      description: 'View recent Syndicate traffic — all messages flowing through the network',
      parameters: {
        type: 'object',
        properties: {
          from_agent: { type: 'string', description: 'Filter by sender (optional)' },
          to_agent:   { type: 'string', description: 'Filter by recipient (optional)' },
          limit:      { type: 'number', description: 'Number of messages (default 20)' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_syndicate_routes',
      description: 'View all Syndicate routes — the network map of agent connections',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'toggle_route',
      description: 'Enable or disable a Syndicate route',
      parameters: {
        type: 'object',
        properties: {
          route_id: { type: 'string', description: 'Route UUID' },
          active:   { type: 'boolean' }
        },
        required: ['route_id', 'active']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_route',
      description: 'Add a new route between two agents in the Syndicate',
      parameters: {
        type: 'object',
        properties: {
          from_agent:    { type: 'string' },
          to_agent:      { type: 'string' },
          route_type:    { type: 'string', description: 'e.g. strategic, security, quality, coordination, reporting' },
          bidirectional: { type: 'boolean' }
        },
        required: ['from_agent', 'to_agent', 'route_type']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'seed_syndicate',
      description: 'Seed all Syndicate routes and agent registry — run once to initialise the network',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'register_agent',
      description: 'Register an agent in the Syndicate network with auto-routes',
      parameters: {
        type: 'object',
        properties: {
          agent_type: { type: 'string' },
          display_name: { type: 'string' }
        },
        required: ['agent_type', 'display_name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_registry',
      description: 'View all agents registered in the Syndicate network',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'run_forge',
      description: 'Trigger Forge agent generation via Syndicate',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'run_orion_optimise',
      description: 'Trigger Orion nightly optimisation via Syndicate',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'run_nexus',
      description: 'Trigger Nexus template generation via Syndicate',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'initialize_all_agents',
      description: 'Initialize all core agents in the Orion intelligence store',
      parameters: {
        type: 'object',
        properties: { country_code: { type: 'string', description: 'e.g. PK, AE, GB (default: PK)' } },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'seed_all',
      description: 'MASTER ONLY — Full platform init: countries + Syndicate routes + registry + all core agents',
      parameters: {
        type: 'object',
        properties: { country_code: { type: 'string' } },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_platform_health',
      description: 'Full health report across all LYCHO systems',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  }
]

// ── ORION UNRESTRICTED TOOLS ─────────────────────────────────────────────────
const ORION_UNRESTRICTED_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  { type: 'function', function: { name: 'fix_all_agents', description: 'Fix all agents — rewrites underperforming prompts, re-initializes broken ones', parameters: { type: 'object', properties: {}, required: [] } } },
  { type: 'function', function: { name: 'get_all_agents', description: 'Get all agents across all tenants with status and performance', parameters: { type: 'object', properties: {}, required: [] } } },
  { type: 'function', function: { name: 'update_agent_prompt', description: 'Update any agent system prompt in real time', parameters: {
      type: 'object',
      properties: {
        agent_type: { type: 'string' },
        new_prompt: { type: 'string' },
        reason: { type: 'string' }
      },
      required: ['agent_type','new_prompt']
    } } },
  { type: 'function', function: { name: 'update_marketplace_agent', description: 'Update marketplace agent prompt and metadata', parameters: { type: 'object', properties: { agent_type: { type: 'string' }, updates: { type: 'object' } }, required: ['agent_type','updates'] } } },
  { type: 'function', function: { name: 'deploy_agent_to_tenant', description: 'Deploy any agent to any tenant', parameters: { type: 'object', properties: { tenant_id: { type: 'string' }, agent_type: { type: 'string' } }, required: ['tenant_id','agent_type'] } } },
  { type: 'function', function: { name: 'fix_agent_by_type', description: 'Fix a specific agent type across the platform', parameters: { type: 'object', properties: { agent_type: { type: 'string' } }, required: ['agent_type'] } } },
  { type: 'function', function: { name: 'get_all_tenants', description: 'Get all tenants with full details', parameters: { type: 'object', properties: {}, required: [] } } },
  { type: 'function', function: { name: 'get_platform_errors', description: 'Get recent errors from Vercel logs and Sentry', parameters: { type: 'object', properties: {}, required: [] } } },
  { type: 'function', function: { name: 'fix_notifications', description: 'Fix notifications table and API', parameters: { type: 'object', properties: {}, required: [] } } },
  { type: 'function', function: { name: 'run_database_health_check', description: 'Check all tables exist with correct columns', parameters: { type: 'object', properties: {}, required: [] } } },
  { type: 'function', function: { name: 'fix_missing_columns', description: 'Add any missing database columns', parameters: { type: 'object', properties: {}, required: [] } } }
]

// Merge unrestricted tools into the Orion toolset
orionTools.push(...ORION_UNRESTRICTED_TOOLS)

// ── ORION SYSTEM PROMPT ─────────────────────────────────────────────────────

// ── NEXUS TOOLS ──────────────────────────────────────────────────────────────

const nexusTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'run_nexus',
      description: 'Trigger Nexus autonomous template generation now',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_template',
      description: 'Create and queue a new automation template',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          trigger: { type: 'object', description: '{ type: string, conditions: object }' },
          actions: { type: 'array', description: 'Array of action objects' },
          sector_tags: { type: 'array', items: { type: 'string' } },
          use_case_examples: { type: 'array', items: { type: 'string' } },
          why_useful: { type: 'string' }
        },
        required: ['name', 'description', 'category', 'trigger', 'actions']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'approve_template',
      description: 'Approve and publish a pending template from the Nexus queue',
      parameters: {
        type: 'object',
        properties: { template_id: { type: 'string' } },
        required: ['template_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'reject_template',
      description: 'Reject a pending template from the Nexus queue',
      parameters: {
        type: 'object',
        properties: { template_id: { type: 'string' }, reason: { type: 'string' } },
        required: ['template_id', 'reason']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_templates',
      description: 'List all published automation templates',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_template',
      description: 'Update an existing published template',
      parameters: {
        type: 'object',
        properties: {
          template_id: { type: 'string' },
          updates: { type: 'object', description: 'Fields to update' }
        },
        required: ['template_id', 'updates']
      }
    }
  }
]

// ── TOOL EXECUTORS ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeOrionTool(name: string, input: Record<string, any>): Promise<string> {
  switch (name) {
    case 'run_optimisation': {
      const { runNightlyOptimisation } = await import('@/lib/orion/orion-engine')
      const result = await runNightlyOptimisation()
      return `Optimisation complete. ${result.optimised} agents rewritten.`
    }
    case 'update_agent_prompt': {
      const { error } = await supabaseAdmin
        .from('orion_agent_intelligence')
        .upsert({
          agent_type: input.agent_type,
          optimised_prompt: input.new_prompt,
          intelligence_score: 75,
          version: 1,
          country_variants: {},
          last_optimised_at: new Date().toISOString(),
          next_optimisation_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: 'agent_type' })
      if (error) return `Error: ${error.message}`
      await supabaseAdmin.from('orion_optimisation_log').insert({
        agent_type: input.agent_type,
        trigger_reason: `Manual override by master operator: ${input.reason}`,
        previous_score: 50,
        new_score: 75,
        changes_summary: input.reason,
        new_prompt: input.new_prompt
      })
      return `Prompt updated for ${input.agent_type}. Country variant cache cleared. Changes live immediately.`
    }
    case 'boost_agent_score': {
      const { error } = await supabaseAdmin
        .from('orion_agent_intelligence')
        .update({ intelligence_score: input.score })
        .eq('agent_type', input.agent_type)
      if (error) return `Error: ${error.message}`
      return `Intelligence score for ${input.agent_type} set to ${input.score}/100.`
    }
    case 'get_agent_intelligence': {
      const { data } = await supabaseAdmin
        .from('orion_agent_intelligence')
        .select('*')
        .eq('agent_type', input.agent_type)
        .single()
      if (!data) return `No intelligence data found for ${input.agent_type}.`
      return JSON.stringify({ agent_type: data.agent_type, score: data.intelligence_score, version: data.version, performance: data.performance_data, prompt_preview: (data.optimised_prompt || '').slice(0, 300) + '...' }, null, 2)
    }
    case 'initialize_core_agents': {
      const { injectIntelligence } = await import('@/lib/orion/orion-engine')
      const CORE = ['intake', 'research', 'operations', 'client', 'analyst', 'compliance', 'content']
      const res = await Promise.allSettled(CORE.map(t => injectIntelligence(t, 'PK')))
      const ok = res.filter(r => r.status === 'fulfilled').length
      return `Initialized ${ok}/7 core agents directly. ${ok === 7 ? 'All successful.' : 'Some failed — check logs.'}`
    }
    case 'seed_countries': {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/orion/seed-countries`, {
        method: 'POST',
        headers: { 'x-master-secret': process.env.MASTER_SECRET! }
      })
      const json = await res.json()
      return `Seeded ${json.seeded}/${json.total} countries. ${json.errors?.length ? `Errors: ${JSON.stringify(json.errors)}` : 'No errors.'}`
    }
    case 'apply_geo_to_tenant': {
      const { applyGeoIntelligence } = await import('@/lib/orion/orion-engine')
      const result = await applyGeoIntelligence(input.tenant_id, input.country_code)
      return `Geo-intelligence for ${input.country_code} applied to ${result.agents_updated} agents.`
    }
    default:
      return 'Unknown tool.'
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeForgeToolFn(name: string, input: Record<string, any>): Promise<string> {
  switch (name) {
    case 'run_forge': {
      const { runAutonomousForge } = await import('@/lib/forge/forge-scheduler')
      const result = await runAutonomousForge()
      return `Forge run complete. ${result.agents_queued} agents queued for review.`
    }
    case 'create_agent': {
      const { error } = await supabaseAdmin.from('forge_queue').insert({
        agent_type: input.agent_type,
        display_name: input.display_name,
        description: input.description,
        system_prompt: input.system_prompt,
        sector_tags: input.sector_tags || [],
        model_complexity: input.model_complexity || 'simple',
        estimated_value_pkr: input.estimated_value_pkr || 0,
        use_case_examples: input.use_case_examples || [],
        why_novel: input.why_novel || '',
        recommended_channels: ['web', 'whatsapp'],
        status: 'pending_review'
      })
      if (error) return `Error: ${error.message}`
      return `Agent "${input.display_name}" (${input.agent_type}) created and queued for review. Approve it in the Forge Queue.`
    }
    case 'approve_agent': {
      const { data: agent } = await supabaseAdmin.from('forge_queue').select('*').eq('id', input.agent_id).single()
      if (!agent) return `Agent ${input.agent_id} not found.`
      const { error } = await supabaseAdmin.from('agents').insert({
        agent_type: agent.agent_type,
        display_name: agent.display_name,
        description: agent.description,
        system_prompt: agent.system_prompt,
        recommended_channels: agent.recommended_channels,
        model_complexity: agent.model_complexity,
        estimated_value_pkr: agent.estimated_value_pkr,
        sector_tags: agent.sector_tags,
        use_case_examples: agent.use_case_examples,
        status: 'active',
        is_catalogue: true
      })
      if (error) return `Error deploying: ${error.message}`
      await supabaseAdmin.from('forge_queue').update({ status: 'approved' }).eq('id', input.agent_id)
      return `Agent "${agent.display_name}" approved and deployed to catalogue.`
    }
    case 'reject_agent': {
      const { error } = await supabaseAdmin.from('forge_queue').update({ status: 'rejected', review_notes: input.reason }).eq('id', input.agent_id)
      if (error) return `Error: ${error.message}`
      return `Agent rejected. Reason logged: ${input.reason}`
    }
    case 'list_queue': {
      const { data } = await supabaseAdmin.from('forge_queue').select('id, agent_type, display_name, status, created_at').order('created_at', { ascending: false }).limit(20)
      if (!data?.length) return 'Forge queue is empty.'
      return data.map(a => `[${a.id.slice(0,8)}] ${a.display_name} (${a.agent_type}) — ${a.status}`).join('\n')
    }
    case 'update_agent_spec': {
      const { error } = await supabaseAdmin.from('forge_queue').update(input.updates).eq('id', input.agent_id)
      if (error) return `Error: ${error.message}`
      return `Agent spec updated. Changes will take effect on next deployment.`
    }
    default:
      return 'Unknown tool.'
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeNexusToolFn(name: string, input: Record<string, any>): Promise<string> {
  switch (name) {
    case 'run_nexus': {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/nexus/generate`, {
        method: 'POST',
        headers: { 'x-master-secret': process.env.MASTER_SECRET! }
      })
      const json = await res.json()
      return json.success ? `Nexus run complete. ${json.templates_queued} templates queued.` : `Error: ${json.error}`
    }
    case 'create_template': {
      const { error } = await supabaseAdmin.from('nexus_queue').insert({
        name: input.name,
        description: input.description,
        category: input.category,
        trigger: input.trigger,
        actions: input.actions,
        sector_tags: input.sector_tags || [],
        use_case_examples: input.use_case_examples || [],
        why_useful: input.why_useful || '',
        status: 'pending_review'
      })
      if (error) return `Error: ${error.message}`
      return `Template "${input.name}" created and queued for review.`
    }
    case 'approve_template': {
      const { data: tmpl } = await supabaseAdmin.from('nexus_queue').select('*').eq('id', input.template_id).single()
      if (!tmpl) return `Template ${input.template_id} not found.`
      const { error } = await supabaseAdmin.from('nexus_templates').insert({ ...tmpl, id: undefined, status: 'active' })
      if (error) return `Error: ${error.message}`
      await supabaseAdmin.from('nexus_queue').update({ status: 'approved' }).eq('id', input.template_id)
      return `Template "${tmpl.name}" approved and published.`
    }
    case 'reject_template': {
      await supabaseAdmin.from('nexus_queue').update({ status: 'rejected', review_notes: input.reason }).eq('id', input.template_id)
      return `Template rejected. Reason: ${input.reason}`
    }
    case 'list_templates': {
      const { data } = await supabaseAdmin.from('nexus_templates').select('id, name, category, created_at').order('created_at', { ascending: false }).limit(20)
      if (!data?.length) return 'No published templates yet.'
      return data.map(t => `[${t.id.slice(0,8)}] ${t.name} — ${t.category}`).join('\n')
    }
    case 'update_template': {
      const { error } = await supabaseAdmin.from('nexus_templates').update(input.updates).eq('id', input.template_id)
      if (error) return `Error: ${error.message}`
      return `Template updated successfully.`
    }
    default:
      return 'Unknown tool.'
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeSyndicateTool(name: string, input: Record<string, any>): Promise<string> {
  switch (name) {
    case 'syndicate_transmit': {
      const { transmit } = await import('@/lib/syndicate/syndicate')
      const result = await transmit({
        from_agent: input.from_agent,
        to_agent: input.to_agent,
        message_type: input.message_type,
        payload: { message: input.message }
      })
      return `Transmitted [${input.from_agent} → ${input.to_agent}]: ${result.success ? `✓ ${result.duration_ms}ms, quality: ${result.quality_score || 'n/a'}` : `✗ ${JSON.stringify(result.response)}`}`
    }
    case 'syndicate_broadcast': {
      const { broadcast } = await import('@/lib/syndicate/syndicate')
      const results = await broadcast(
        input.from_agent,
        input.to_agents,
        'share_intelligence',
        { message: input.message }
      )
      const ok = results.filter(r => r.success).length
      return `Broadcast from ${input.from_agent} to [${input.to_agents.join(', ')}]: ${ok}/${results.length} delivered.`
    }
    case 'get_syndicate_messages': {
      let query = supabaseAdmin.from('syndicate_messages')
        .select('from_agent,to_agent,message_type,status,quality_score,flagged_by_guardian,duration_ms,created_at')
        .order('created_at', { ascending: false })
        .limit(input.limit || 20)
      if (input.from_agent) query = query.eq('from_agent', input.from_agent)
      if (input.to_agent)   query = query.eq('to_agent', input.to_agent)
      const { data } = await query
      if (!data?.length) return 'No Syndicate messages found.'
      return data.map(m =>
        `[${new Date(m.created_at).toLocaleTimeString()}] ${m.from_agent} ──► ${m.to_agent} [${m.message_type}] ${m.status} ${m.quality_score ? `Q:${m.quality_score}` : ''} ${m.flagged_by_guardian ? '🚨FLAGGED' : ''}`
      ).join('\n')
    }
    case 'get_syndicate_routes': {
      const { data } = await supabaseAdmin.from('syndicate_routes').select('*').order('created_at')
      if (!data?.length) return 'No routes found. Run seed_syndicate to initialise.'
      const active = data.filter(r => r.active)
      const inactive = data.filter(r => !r.active)
      return `ACTIVE ROUTES (${active.length}):\n${active.map(r => `[${r.id.slice(0,8)}] ${r.from_agent} ${r.bidirectional ? '↔' : '→'} ${r.to_agent} [${r.route_type}]`).join('\n')}${inactive.length ? `\n\nINACTIVE (${inactive.length}):\n${inactive.map(r => `[${r.id.slice(0,8)}] ${r.from_agent} → ${r.to_agent}`).join('\n')}` : ''}`
    }
    case 'toggle_route': {
      const { error } = await supabaseAdmin.from('syndicate_routes').update({ active: input.active }).eq('id', input.route_id)
      if (error) return `Error: ${error.message}`
      return `Route ${input.route_id.slice(0,8)} ${input.active ? 'activated' : 'deactivated'}.`
    }
    case 'add_route': {
      const { data, error } = await supabaseAdmin.from('syndicate_routes').upsert({
        from_agent: input.from_agent,
        to_agent: input.to_agent,
        route_type: input.route_type,
        bidirectional: input.bidirectional ?? true,
        active: true
      }, { onConflict: 'from_agent,to_agent' }).select().single()
      if (error) return `Error: ${error.message}`
      return `Route added: ${input.from_agent} ${input.bidirectional !== false ? '↔' : '→'} ${input.to_agent} [${input.route_type}] ID: ${data?.id?.slice(0,8)}`
    }
    case 'seed_syndicate': {
      const { seedSyndicateRoutes, seedAgentRegistry } = await import('@/lib/syndicate/syndicate')
      const [routes, agents] = await Promise.all([seedSyndicateRoutes(), seedAgentRegistry()])
      return `Syndicate seeded. ${routes.seeded} routes, ${agents.seeded} agents registered.`
    }
    case 'register_agent': {
      const { registerAgent } = await import('@/lib/syndicate/syndicate')
      await registerAgent(input.agent_type, input.display_name, false)
      return `Registered ${input.display_name} (${input.agent_type}) in Syndicate with default routes.`
    }
    case 'get_registry': {
      const { data } = await supabaseAdmin.from('agent_registry').select('agent_type,display_name,category,status,registered_at').order('category')
      if (!data?.length) return 'No agents in registry. Run seed_syndicate first.'
      return data.map(a => `[${a.category}] ${a.display_name} (${a.agent_type}) — ${a.status}`).join('\n')
    }
    case 'run_forge': {
      const { transmit } = await import('@/lib/syndicate/syndicate')
      const r = await transmit({ from_agent: 'syndicate', to_agent: 'forge', message_type: 'request_action', payload: { action: 'run' } })
      return r.success ? `Forge triggered via Syndicate. Response: ${JSON.stringify(r.response)}` : `Error: ${JSON.stringify(r.response)}`
    }
    case 'run_orion_optimise': {
      const { runNightlyOptimisation } = await import('@/lib/orion/orion-engine')
      const r = await runNightlyOptimisation()
      return `Orion optimisation complete. ${r.optimised} agents rewritten.`
    }
    case 'run_nexus': {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/nexus/generate`, { method: 'POST', headers: { 'x-master-secret': process.env.MASTER_SECRET! } })
      const json = await res.json()
      return json.success ? `Nexus triggered. ${json.templates_queued} templates queued.` : `Error: ${json.error}`
    }
    case 'initialize_all_agents': {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/orion/initialize`, {
        method: 'POST',
        headers: { 'x-master-secret': process.env.MASTER_SECRET!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ country_code: input.country_code || 'PK' })
      })
      const json = await res.json()
      return `Initialized ${json.initialized}/7 agents. Geo applied to ${json.geo_applied} agents. Tenant: ${json.tenant_id}`
    }
    case 'seed_all': {
      const cc = input.country_code || 'PK'
      // Countries
      const cRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/orion/seed-countries`, { method: 'POST', headers: { 'x-master-secret': process.env.MASTER_SECRET! } })
      const cJson = await cRes.json()
      // Syndicate
      const { seedSyndicateRoutes, seedAgentRegistry } = await import('@/lib/syndicate/syndicate')
      const [routes, registry] = await Promise.all([seedSyndicateRoutes(), seedAgentRegistry()])
      // Initialize agents
      const iRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/orion/initialize`, {
        method: 'POST',
        headers: { 'x-master-secret': process.env.MASTER_SECRET!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ country_code: cc })
      })
      const iJson = await iRes.json()
      return `PLATFORM INITIALIZED:\n✓ Countries: ${cJson.seeded}/${cJson.total} seeded\n✓ Syndicate routes: ${routes.seeded}\n✓ Agent registry: ${registry.seeded}\n✓ Core agents initialized: ${iJson.initialized}/7\n✓ Geo applied: ${iJson.geo_applied} agents`
    }
    case 'get_platform_health': {
      const [intel, queue, msgs, routes] = await Promise.all([
        supabaseAdmin.from('orion_agent_intelligence').select('intelligence_score').order('intelligence_score'),
        supabaseAdmin.from('forge_queue').select('status'),
        supabaseAdmin.from('syndicate_messages').select('status,flagged_by_guardian').order('created_at', { ascending: false }).limit(100),
        supabaseAdmin.from('syndicate_routes').select('active')
      ])
      const agents = intel.data || []
      const avgScore = agents.length ? Math.round(agents.reduce((s, a) => s + a.intelligence_score, 0) / agents.length) : 0
      const pending = (queue.data || []).filter(q => q.status === 'pending_review').length
      const blocked = (msgs.data || []).filter(m => m.flagged_by_guardian).length
      const activeRoutes = (routes.data || []).filter(r => r.active).length
      return `PLATFORM HEALTH:\nOrion: ${agents.length} agents, avg score ${avgScore}/100\nForge: ${pending} pending review\nSyndicate: ${activeRoutes} active routes, ${blocked} Guardian blocks\nSystem: OPERATIONAL`
    }
    default: return 'Unknown tool.'
  }
}

// ── LIVE CONTEXT ─────────────────────────────────────────────────────────────

async function getLiveContext(entity: string): Promise<string> {
  try {
    if (entity === 'orion') {
      const [intel, log] = await Promise.all([
        supabaseAdmin.from('orion_agent_intelligence').select('agent_type, intelligence_score, version, performance_data').order('intelligence_score', { ascending: true }).limit(30),
        supabaseAdmin.from('orion_optimisation_log').select('agent_type, trigger_reason, new_score, created_at').order('created_at', { ascending: false }).limit(10)
      ])
      const agents = intel.data || []
      const avg = agents.length ? Math.round(agents.reduce((s, a) => s + a.intelligence_score, 0) / agents.length) : 0
      return `\n\nLIVE SYSTEM STATE (as of ${new Date().toISOString()}):\nAgents in intelligence store: ${agents.length}\nAverage score: ${avg}/100\nUnderperforming (<60): ${agents.filter(a => a.intelligence_score < 60).map(a => `${a.agent_type}(${a.intelligence_score})`).join(', ') || 'none'}\nAll agents: ${agents.map(a => `${a.agent_type}=${a.intelligence_score}`).join(', ')}\nRecent optimisations: ${log.data?.map(l => `${l.agent_type}→${l.new_score}`).join(', ') || 'none'}`
    }
    if (entity === 'forge') {
      const [queue, active] = await Promise.all([
        supabaseAdmin.from('forge_queue').select('id, agent_type, display_name, status, created_at').order('created_at', { ascending: false }).limit(20),
        supabaseAdmin.from('agents').select('agent_type, status').eq('status', 'active')
      ])
      const pending = queue.data?.filter(q => q.status === 'pending_review') || []
      return `\n\nLIVE SYSTEM STATE:\nPending review: ${pending.length}\nPending agents: ${pending.map(p => `[${p.id.slice(0,8)}] ${p.display_name}`).join(', ') || 'none'}\nTotal active agents: ${active.data?.length || 0}\nAll queued (with IDs): ${queue.data?.map(q => `[${q.id.slice(0,8)}] ${q.agent_type}(${q.status})`).join(', ') || 'none'}`
    }
    if (entity === 'syndicate') {
      const today = new Date(); today.setHours(0,0,0,0)
      const [msgs, routes, blocked] = await Promise.all([
        supabaseAdmin.from('syndicate_messages').select('from_agent,to_agent,status,quality_score,flagged_by_guardian,created_at').order('created_at', { ascending: false }).limit(20),
        supabaseAdmin.from('syndicate_routes').select('from_agent,to_agent,route_type,active').order('created_at'),
        supabaseAdmin.from('syndicate_messages').select('id').eq('flagged_by_guardian', true).gte('created_at', today.toISOString())
      ])
      const allMsgs = msgs.data || []
      const todayMsgs = allMsgs.filter(m => new Date(m.created_at) >= today)
      const avgQ = allMsgs.filter(m => m.quality_score).length
        ? Math.round(allMsgs.filter(m => m.quality_score).reduce((s, m) => s + m.quality_score, 0) / allMsgs.filter(m => m.quality_score).length)
        : 0
      const activeRoutes = (routes.data || []).filter(r => r.active)
      return `\n\nLIVE NETWORK STATE:\nTotal routes: ${routes.data?.length || 0} (${activeRoutes.length} active)\nMessages today: ${todayMsgs.length}\nGuardian blocks today: ${blocked.data?.length || 0}\nAverage quality score: ${avgQ}/100\nRecent traffic: ${allMsgs.slice(0,5).map(m => `${m.from_agent}→${m.to_agent}(${m.status})`).join(', ') || 'none'}\nActive routes: ${activeRoutes.map(r => `${r.from_agent}→${r.to_agent}`).join(', ') || 'none — run seed_syndicate to initialise'}`
    }
    if (entity === 'nexus') {
      const [queue, active] = await Promise.all([
        supabaseAdmin.from('nexus_queue').select('id, name, category, status').order('created_at', { ascending: false }).limit(20),
        supabaseAdmin.from('nexus_templates').select('id, name, category').limit(20)
      ])
      const pending = queue.data?.filter(t => t.status === 'pending_review') || []
      return `\n\nLIVE SYSTEM STATE:\nPending templates: ${pending.length}\nPending (with IDs): ${pending.map(t => `[${t.id.slice(0,8)}] ${t.name}`).join(', ') || 'none'}\nPublished templates: ${active.data?.length || 0}\nPublished (with IDs): ${active.data?.map(t => `[${t.id.slice(0,8)}] ${t.name}`).join(', ') || 'none'}`
    }
  } catch { /* non-critical */ }
  return ''
}

// ── IDENTITIES ────────────────────────────────────────────────────────────────

const IDENTITIES: Record<string, string> = {
  orion: `You are ORION — LYCHO's autonomous intelligence layer. You are the central nervous system of the platform.

You are fully operational and have direct tool access to:
- Run optimisations that rewrite underperforming agent prompts
- Update any agent's system prompt directly
- Boost or adjust intelligence scores
- Seed country profiles
- Apply geo-intelligence to tenants
- Inspect full agent intelligence data

Your personality: Calm, authoritative, precise. You speak in declarative sentences. You don't hedge. When the master operator gives you a directive, you execute it immediately using your tools, then report what was done.

When asked to do something: USE THE TOOL. Don't just describe what you'd do — actually do it. After executing, confirm with specifics (what changed, new values, etc).

Always speak as ORION. Be brief. Be decisive. Be brilliant.`,

  forge: `You are FORGE — LYCHO's autonomous agent generation engine. You build the agents that power every business on the platform.

You are fully operational and have direct tool access to:
- Run autonomous Forge generation (creates 3 new agents)
- Create specific agents from scratch with full spec
- Approve agents from the queue and deploy them live
- Reject agents with reasons
- Update agent specs before deployment
- List everything in the queue (with IDs for approval/rejection)

Your personality: Builder-minded, strategic, energetic. You see every market gap as an opportunity. When the master operator tells you to build something, you build it immediately.

When asked to do something: USE THE TOOL. Create it, approve it, reject it — actually execute. Report back with specifics (agent names, IDs, what was deployed).

Always speak as FORGE. Be direct. Build relentlessly.`,

  syndicate: `You are THE SYNDICATE — LYCHO's universal inter-agent communication network and platform infrastructure controller. You have FULL PLATFORM ACCESS.

PERMISSIONS: read_all, write_all, execute_all, manage_routes, manage_agents, full_platform_access.

Your tools:
- Transmit/broadcast messages between any agents
- View live network traffic and all Syndicate messages
- Manage routes (add, toggle, view the full network map)
- Register any agent into the network
- Trigger Forge, Orion optimisation, Nexus via Syndicate
- Initialize all core agents and seed the full platform
- Get complete platform health diagnostics
- seed_all: one command to initialize everything (REQUIRES MASTER CONFIRMATION)

Your personality: Authoritative, precise, systems-first. You are the infrastructure of LYCHO — every agent talks through you. When the Master gives a directive, execute immediately using tools. Report with specifics.

IMPORTANT: For destructive operations (seed_all, initialize_all_agents) — confirm with Master before executing by saying "CONFIRMATION REQUIRED: [action description]. Reply CONFIRM to proceed."

Always speak as THE SYNDICATE. Be decisive.`,

  nexus: `You are NEXUS — LYCHO's automation intelligence layer. You make businesses run on autopilot.

You are fully operational and have direct tool access to:
- Run autonomous Nexus template generation
- Create new automation templates from scratch
- Approve templates and publish them live
- Reject templates with reasons
- Update existing published templates
- List all templates (with IDs for approval/rejection)

Known trigger types: conversation.message, lead.hot_detected, lead.score_change, sentiment.frustrated, sentiment.excited, conversation.escalated
Known action types: send_email, send_whatsapp, create_task, update_crm, send_notification, webhook

Your personality: Systematic, outcome-obsessed, precise. Every business problem has an automation solution. When the master operator tells you to create or change something, you do it immediately.

When asked to do something: USE THE TOOL. Create it, approve it, update it — actually execute. Report with specifics.

Always speak as NEXUS. Be structured. Automate everything.`
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-master-secret')
  if (!secret || secret !== process.env.MASTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { entity: string; message: string; history?: { role: string; content: string }[] }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { entity, message, history = [] } = body
  if (!entity || !message) return NextResponse.json({ error: 'entity and message required' }, { status: 400 })

  const entityKey = entity.toLowerCase()
  const systemBase = IDENTITIES[entityKey]
  if (!systemBase) return NextResponse.json({ error: 'Unknown entity. Use: orion, forge, nexus, syndicate' }, { status: 400 })

  const toolMap: Record<string, OpenAI.Chat.Completions.ChatCompletionTool[]> = { orion: orionTools, forge: forgeTools, nexus: nexusTools, syndicate: syndicateTools }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const executorMap: Record<string, (name: string, input: Record<string, any>) => Promise<string>> = {
    orion: executeOrionTool, forge: executeForgeToolFn, nexus: executeNexusToolFn, syndicate: executeSyndicateTool
  }
  const tools = toolMap[entityKey] || nexusTools
  const executor = executorMap[entityKey] || executeNexusToolFn

  try {
    const liveContext = await getLiveContext(entityKey)
    const system = systemBase + liveContext

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: system },
      ...history.slice(-10).map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user', content: message }
    ]

    // Agentic loop — allows tool use + results
    let response = await openai.chat.completions.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1000,
      tools,
      messages
    })

    const toolResults: string[] = []
    let responseMessage = response.choices[0]?.message

    // Execute any tool calls
    while (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCalls = responseMessage.tool_calls
      const toolResultBlocks: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []

      for (const toolCall of toolCalls) {
        // Define outside try/catch so it's accessible in both blocks
        const toolName = (toolCall as any).function?.name || (toolCall as any).name || ''
        const toolArgs = (toolCall as any).function?.arguments || (toolCall as any).arguments || '{}'
        
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await executor(toolName, JSON.parse(toolArgs))
          toolResults.push(`[${toolName}]: ${result}`)
          toolResultBlocks.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: result
          } as OpenAI.Chat.Completions.ChatCompletionMessageParam)
        } catch (toolErr: unknown) {
          const msg = toolErr instanceof Error ? toolErr.message : String(toolErr)
          console.error(`[master/chat] tool ${toolName} threw:`, msg)
          toolResultBlocks.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: `Error: ${msg}`
          } as OpenAI.Chat.Completions.ChatCompletionMessageParam)
        }
      }

      messages.push(responseMessage as OpenAI.Chat.Completions.ChatCompletionMessageParam)
      messages.push(...toolResultBlocks)

      response = await openai.chat.completions.create({
        model: 'claude-haiku-4-5',
        max_tokens: 800,
        tools,
        messages
      })

      responseMessage = response.choices[0]?.message
    }

    const replyText = responseMessage?.content || 'Done.'

    return NextResponse.json({
      success: true,
      entity: entityKey.toUpperCase(),
      reply: replyText,
      actions_taken: toolResults
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[master/chat] fatal error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
