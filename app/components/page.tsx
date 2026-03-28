'use client'

import { useState } from 'react'
import { LayoutDashboard, Bot, Users, Settings, Zap } from 'lucide-react'
import {
  Button,
  Input,
  Card,
  Badge,
  Modal,
  Table,
  Sidebar,
  TopBar,
  StatCard,
  AgentCard,
} from '@/components/ui'
import type { Column } from '@/components/ui'

interface AgentRow {
  id: number
  agent: string
  status: string
  interactions: number
  channel: string
}

const tableData: AgentRow[] = [
  { id: 1, agent: 'Sales Agent',     status: 'Active', interactions: 1240, channel: 'Chat' },
  { id: 2, agent: 'Support Bot',     status: 'Paused', interactions: 876,  channel: 'Email' },
  { id: 3, agent: 'Lead Qualifier',  status: 'Active', interactions: 3021, channel: 'Web' },
  { id: 4, agent: 'Onboarding Flow', status: 'Active', interactions: 540,  channel: 'Chat' },
]

const tableColumns: Column<AgentRow>[] = [
  { key: 'agent',        header: 'Agent' },
  {
    key: 'status',
    header: 'Status',
    render: (v) => (
      <Badge variant={v === 'Active' ? 'green' : 'grey'}>{String(v)}</Badge>
    ),
  },
  {
    key: 'interactions',
    header: 'Interactions',
    render: (v) => (
      <span className="font-bebas text-base text-gold tracking-wider">
        {Number(v).toLocaleString()}
      </span>
    ),
  },
  { key: 'channel', header: 'Channel' },
]

const sidebarItems = [
  { label: 'Dashboard',  href: '/',           icon: <LayoutDashboard size={16} /> },
  { label: 'Agents',     href: '/components', icon: <Bot size={16} /> },
  { label: 'Team',       href: '/team',        icon: <Users size={16} /> },
  { label: 'Automations',href: '/automations', icon: <Zap size={16} /> },
  { label: 'Settings',   href: '/settings',    icon: <Settings size={16} /> },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-cormorant text-2xl text-ivory font-medium mb-1 border-b border-border pb-2">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export default function ComponentsPage() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-void text-ivory flex flex-col">
      <TopBar title="Component Library" userInitials="MS" />

      <div className="flex flex-1">
        <Sidebar items={sidebarItems} />

        <main className="flex-1 p-8 space-y-14 overflow-auto">
          {/* Header */}
          <div>
            <p className="text-xs text-muted font-mono uppercase tracking-[0.2em] mb-1">Design System v1</p>
            <h1 className="font-bebas text-5xl tracking-[0.15em] text-gold leading-none">
              LYCHO UI
            </h1>
            <p className="text-muted text-sm mt-2">
              All components use the LYCHO dark palette and gold accent system.
            </p>
          </div>

          {/* Button */}
          <Section title="Button">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="primary" disabled>Disabled</Button>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
              </div>
            </div>
          </Section>

          {/* Input */}
          <Section title="Input">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input label="Agent Name" placeholder="e.g. Sales Bot" />
              <Input label="Email Address" placeholder="you@lycho.ai" type="email" />
              <Input
                label="With Error"
                placeholder="Enter value"
                defaultValue="bad input"
                error="This field is required."
              />
              <Input label="Disabled" placeholder="Not editable" disabled />
            </div>
          </Section>

          {/* Card */}
          <Section title="Card">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <Card>
                <p className="text-xs text-muted uppercase tracking-widest mb-2 font-mono">Default</p>
                <p className="text-sm text-ivory/70">
                  Dark surface card with a subtle border. Use for content blocks and groupings.
                </p>
              </Card>
              <Card variant="highlighted">
                <p className="text-xs text-muted uppercase tracking-widest mb-2 font-mono">Highlighted</p>
                <p className="text-sm text-ivory/70">
                  Gold left border variant for featured content, alerts, or important notices.
                </p>
              </Card>
            </div>
          </Section>

          {/* Badge */}
          <Section title="Badge">
            <div className="flex flex-wrap gap-3 items-center">
              <Badge variant="gold">Gold</Badge>
              <Badge variant="green">Active</Badge>
              <Badge variant="red">Error</Badge>
              <Badge variant="grey">Paused</Badge>
            </div>
          </Section>

          {/* Modal */}
          <Section title="Modal">
            <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
            <Modal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Deploy Agent"
              onConfirm={() => setModalOpen(false)}
              confirmLabel="Deploy"
              cancelLabel="Cancel"
            >
              Are you sure you want to deploy this agent? It will immediately begin
              responding to users on all configured channels.
            </Modal>
          </Section>

          {/* Table */}
          <Section title="Table">
            <Table<AgentRow>
              columns={tableColumns}
              data={tableData}
              keyField="id"
            />
          </Section>

          {/* StatCard */}
          <Section title="StatCard">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Agents"  value="12"    trend="up"   trendValue="+2 this week" />
              <StatCard label="Interactions"  value="48.2K" trend="up"   trendValue="+18% MoM" />
              <StatCard label="Avg. Response" value="1.4s"  trend="down" trendValue="−0.3s faster" />
              <StatCard label="Error Rate"    value="0.2%"  trend="down" trendValue="−0.1% this week" />
            </div>
          </Section>

          {/* AgentCard */}
          <Section title="AgentCard">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AgentCard
                name="Sales Agent"
                status="active"
                interactions={1240}
                channels={['chat', 'web']}
                description="Qualifies and converts inbound leads"
              />
              <AgentCard
                name="Support Bot"
                status="active"
                interactions={3821}
                channels={['chat', 'email']}
                description="Handles tier-1 support tickets 24/7"
              />
              <AgentCard
                name="Lead Qualifier"
                status="paused"
                interactions={892}
                channels={['email']}
                description="Cold email outreach automation"
              />
            </div>
          </Section>

          {/* Sidebar / TopBar note */}
          <Section title="Sidebar & TopBar">
            <Card variant="highlighted">
              <p className="text-sm text-ivory/70">
                The <span className="text-gold font-mono text-xs">Sidebar</span> and{' '}
                <span className="text-gold font-mono text-xs">TopBar</span> components are
                live on this page — the navigation on the left and the header above are
                both rendered from the component library.
              </p>
            </Card>
          </Section>
        </main>
      </div>
    </div>
  )
}
