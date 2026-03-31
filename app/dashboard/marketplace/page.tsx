'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Check } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { AGENT_CATALOGUE } from '@/lib/agents-catalogue'
import type { CatalogueAgent } from '@/lib/agents-catalogue'
import { DeployAgentModal } from '@/components/dashboard/DeployAgentModal'
import { createClientSupabase } from '@/lib/supabase'

function AgentIcon({ name, size = 18 }: { name: string; size?: number }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as Record<string, any>)[name] as React.ElementType | undefined
  if (!Icon) return null
  return <Icon size={size} />
}

type Category = 'all' | 'core' | 'business_suite' | string

interface FlatAgent extends CatalogueAgent {
  category: string
  categoryLabel: string
  isNew?: boolean
}

const SECTOR_LABELS: Record<string, string> = {
  healthcare:        'Healthcare',
  legal:             'Legal',
  finance:           'Finance',
  real_estate:       'Real Estate',
  education:         'Education',
  ecommerce:         'E-commerce',
  hospitality:       'Hospitality',
  manufacturing:     'Manufacturing',
  food_beverage:     'Food & Beverage',
  logistics:         'Logistics',
  construction:      'Construction',
  insurance:         'Insurance',
  automotive:        'Automotive',
  beauty_wellness:   'Beauty & Wellness',
  agriculture:       'Agriculture',
  nonprofit:         'Non-profit',
  telecommunications:'Telecommunications',
  sports_fitness:    'Sports & Fitness',
}

function flattenCatalogue(): FlatAgent[] {
  const result: FlatAgent[] = []

  for (const a of AGENT_CATALOGUE.core) {
    result.push({ ...a, category: 'core', categoryLabel: 'Core' })
  }
  for (const a of AGENT_CATALOGUE.business_suite) {
    result.push({ ...a, category: 'business_suite', categoryLabel: 'Business Suite' })
  }
  for (const [sector, agents] of Object.entries(AGENT_CATALOGUE.sectors)) {
    for (const a of agents) {
      result.push({ ...a, category: sector, categoryLabel: SECTOR_LABELS[sector] ?? sector })
    }
  }

  return result
}

const ALL_AGENTS = flattenCatalogue()

const CATEGORY_OPTIONS = [
  { value: 'all',            label: 'All Categories' },
  { value: 'core',           label: 'Core' },
  { value: 'business_suite', label: 'Business Suite' },
  ...Object.entries(SECTOR_LABELS).map(([k, v]) => ({ value: k, label: v })),
]

export default function MarketplacePage() {
  const [query, setQuery]           = useState('')
  const [category, setCategory]     = useState<Category>('all')
  const [deployedTypes, setDeployedTypes] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen]   = useState(false)
  const [tenantSector, setTenantSector] = useState<string | null>(null)
  const [dbAgents, setDbAgents]     = useState<FlatAgent[]>([])
  const supabase = createClientSupabase()

  // Load deployed agent types + tenant sector + DB marketplace agents
  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const [agentsRes, userRes, dbRes] = await Promise.all([
        supabase.from('agents').select('agent_type').neq('status', 'deleted'),
        supabase.from('users').select('tenants(sector)').eq('id', session.user.id).single(),
        fetch('/api/marketplace/agents').then(r => r.json()).catch(() => ({ data: { agents: [] } })),
      ])

      if (agentsRes.data) {
        setDeployedTypes(new Set(agentsRes.data.map((a: { agent_type: string }) => a.agent_type)))
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tenant = (userRes.data as any)?.tenants
      if (tenant?.sector) setTenantSector(tenant.sector)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawDbAgents: any[] = dbRes?.data?.agents ?? []
      const mapped: FlatAgent[] = rawDbAgents.map(a => ({
        type:          a.agent_type as string,
        name:          a.display_name as string,
        description:   a.description as string,
        icon:          'Bot',
        status:        'available' as const,
        category:      (a.sector_tags?.[0] as string) || 'marketplace',
        categoryLabel: 'Marketplace',
        isNew:         true,
      }))
      setDbAgents(mapped)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Merge static catalogue with DB agents (DB agents first, deduped by type)
  const allAgents = useMemo(() => {
    const staticTypes = new Set(ALL_AGENTS.map(a => a.type))
    const uniqueDb = dbAgents.filter(a => !staticTypes.has(a.type))
    return [...uniqueDb, ...ALL_AGENTS]
  }, [dbAgents])

  const filtered = useMemo(() => {
    return allAgents.filter(a => {
      const matchCat = category === 'all' || a.category === category
      const matchQ   = !query || a.name.toLowerCase().includes(query.toLowerCase()) ||
                       a.description.toLowerCase().includes(query.toLowerCase())
      return matchCat && matchQ
    })
  }, [allAgents, query, category])

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1
          className="font-bebas tracking-wider mb-1"
          style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#F0EBE1', letterSpacing: '0.05em' }}
        >
          Agent Marketplace
        </h1>
        <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>
          Browse {allAgents.length}+ AI agents. Deploy in one click.
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: '#6b6b6b' }}
          />
          <input
            type="text"
            placeholder="Search agents..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm font-sans outline-none transition-colors"
            style={{
              background: '#141414',
              border: '1px solid #2a2a2a',
              color: '#F0EBE1',
            }}
          />
        </div>

        <select
          value={category}
          onChange={e => setCategory(e.target.value as Category)}
          className="px-4 py-2.5 rounded-lg text-sm font-sans outline-none"
          style={{
            background: '#141414',
            border: '1px solid #2a2a2a',
            color: category === 'all' ? '#6b6b6b' : '#F0EBE1',
            minWidth: '180px',
          }}
        >
          {CATEGORY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="text-xs font-sans mb-5" style={{ color: '#6b6b6b' }}>
        {filtered.length} agent{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24" style={{ color: '#6b6b6b' }}>
          <p className="text-sm font-sans">No agents match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(agent => {
            const deployed = deployedTypes.has(agent.type)

            return (
              <div
                key={agent.type}
                className="rounded-xl p-5 flex flex-col"
                style={{
                  background: '#141414',
                  border: deployed ? '1px solid rgba(201,168,76,0.25)' : '1px solid #2a2a2a',
                }}
              >
                {/* Icon + badge row */}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}
                  >
                    <AgentIcon name={agent.icon} size={17} />
                  </div>
                  {deployed ? (
                    <span
                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-sans"
                      style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C' }}
                    >
                      <Check size={10} />
                      Deployed
                    </span>
                  ) : agent.isNew ? (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-sans font-semibold"
                      style={{ background: 'rgba(201,168,76,0.2)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.4)' }}
                    >
                      NEW
                    </span>
                  ) : (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-sans"
                      style={{ background: '#1c1c1c', color: '#6b6b6b', border: '1px solid #2a2a2a' }}
                    >
                      {agent.categoryLabel}
                    </span>
                  )}
                </div>

                {/* Name + desc */}
                <p className="text-sm font-sans font-medium mb-1" style={{ color: '#F0EBE1' }}>{agent.name}</p>
                <p className="text-xs font-sans leading-relaxed flex-1 mb-4" style={{ color: '#6b6b6b' }}>
                  {agent.description}
                </p>

                {/* Deploy button */}
                <button
                  className="w-full py-2 rounded-lg text-xs font-sans font-medium transition-opacity"
                  style={
                    deployed
                      ? { background: 'rgba(201,168,76,0.08)', color: '#C9A84C', cursor: 'default' }
                      : { background: '#C9A84C', color: '#070707' }
                  }
                  onClick={() => { if (!deployed) setModalOpen(true) }}
                  disabled={deployed}
                >
                  {deployed ? 'Already Deployed' : 'Deploy Agent'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <DeployAgentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        tenantSector={tenantSector}
        onDeployed={() => {
          setModalOpen(false)
          // Refresh deployed set
          supabase.from('agents').select('agent_type').neq('status', 'deleted').then(({ data }) => {
            if (data) setDeployedTypes(new Set((data as { agent_type: string }[]).map(a => a.agent_type)))
          })
        }}
      />
    </div>
  )
}
