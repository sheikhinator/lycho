import type { ChannelType } from '@/lib/channels/channel-bus'

export interface AgentCapability {
  agent_type:          string
  name:                string
  description:         string
  supported_channels:  ChannelType[]
  supported_media:     ('text' | 'image' | 'audio' | 'document' | 'location' | 'video' | 'sticker')[]
  can_escalate:        boolean
  can_book_appointments: boolean
  can_process_payments:  boolean
  can_send_files:      boolean
  languages:           string[]
  model:               'gemini-2.0-flash' | 'gemini-2.5-pro'
  avg_response_ms:     number
  max_tokens:          number
  use_cases:           string[]
  limitations:         string[]
}

export const AGENT_CAPABILITIES: Record<string, AgentCapability> = {
  intake: {
    agent_type:              'intake',
    name:                    'Intake Agent',
    description:             'First-line contact handler — qualifies leads, collects information, and routes to the right team.',
    supported_channels:      ['whatsapp', 'web_widget', 'facebook_messenger', 'instagram', 'sms', 'telegram'],
    supported_media:         ['text', 'image', 'document', 'location'],
    can_escalate:            true,
    can_book_appointments:   true,
    can_process_payments:    false,
    can_send_files:          false,
    languages:               ['English', 'Urdu', 'Arabic'],
    model:                   'gemini-2.0-flash',
    avg_response_ms:         800,
    max_tokens:              600,
    use_cases:               [
      'Lead qualification',
      'Contact information collection',
      'Initial product/service enquiries',
      'Appointment booking',
      'FAQ answering',
    ],
    limitations:             [
      'Cannot access real-time inventory',
      'Cannot process payments',
      'Routes complex queries to human agents',
    ],
  },

  research: {
    agent_type:              'research',
    name:                    'Research Agent',
    description:             'Deep-dive investigator — analyses data, synthesises information, and delivers structured intelligence reports.',
    supported_channels:      ['email', 'slack', 'teams', 'web_widget', 'api'],
    supported_media:         ['text', 'document'],
    can_escalate:            false,
    can_book_appointments:   false,
    can_process_payments:    false,
    can_send_files:          true,
    languages:               ['English'],
    model:                   'gemini-2.5-pro',
    avg_response_ms:         3500,
    max_tokens:              900,
    use_cases:               [
      'Market research & competitive analysis',
      'Due diligence reports',
      'Industry trend analysis',
      'Product comparison',
      'Data synthesis from multiple sources',
    ],
    limitations:             [
      'No real-time internet access',
      'Knowledge cutoff applies',
      'Not suitable for transactional workflows',
    ],
  },

  operations: {
    agent_type:              'operations',
    name:                    'Operations Agent',
    description:             'Back-office automation — executes workflows, manages tasks, and keeps operations running smoothly.',
    supported_channels:      ['slack', 'teams', 'email', 'api', 'webhook'],
    supported_media:         ['text', 'document'],
    can_escalate:            true,
    can_book_appointments:   true,
    can_process_payments:    false,
    can_send_files:          true,
    languages:               ['English', 'Urdu'],
    model:                   'gemini-2.0-flash',
    avg_response_ms:         900,
    max_tokens:              600,
    use_cases:               [
      'Task assignment & tracking',
      'Workflow automation',
      'Internal process queries',
      'Schedule management',
      'Status updates & reporting',
    ],
    limitations:             [
      'Confirms before irreversible actions',
      'Cannot directly modify external systems without integration',
    ],
  },

  client: {
    agent_type:              'client',
    name:                    'Client Agent',
    description:             'Relationship manager — handles existing customers with personalised, empathetic service.',
    supported_channels:      ['whatsapp', 'email', 'instagram', 'facebook_messenger', 'telegram', 'sms', 'web_widget'],
    supported_media:         ['text', 'image', 'audio', 'document', 'video', 'sticker'],
    can_escalate:            true,
    can_book_appointments:   true,
    can_process_payments:    false,
    can_send_files:          true,
    languages:               ['English', 'Urdu', 'Arabic'],
    model:                   'gemini-2.0-flash',
    avg_response_ms:         700,
    max_tokens:              600,
    use_cases:               [
      'Customer support & issue resolution',
      'Order status enquiries',
      'Relationship nurturing',
      'Upsell & cross-sell conversations',
      'Feedback & satisfaction tracking',
    ],
    limitations:             [
      'Cannot process refunds directly',
      'Escalates billing disputes to human team',
    ],
  },

  analyst: {
    agent_type:              'analyst',
    name:                    'Analyst Agent',
    description:             'Data strategist — interprets metrics, identifies patterns, and recommends data-driven actions.',
    supported_channels:      ['slack', 'teams', 'email', 'api', 'web_widget'],
    supported_media:         ['text', 'document'],
    can_escalate:            false,
    can_book_appointments:   false,
    can_process_payments:    false,
    can_send_files:          true,
    languages:               ['English'],
    model:                   'gemini-2.5-pro',
    avg_response_ms:         4000,
    max_tokens:              900,
    use_cases:               [
      'Business performance analysis',
      'KPI interpretation',
      'Revenue trend analysis',
      'Customer behaviour insights',
      'Forecasting & scenario modelling',
    ],
    limitations:             [
      'Analysis based on provided data only',
      'No live database access by default',
      'Confidence levels are estimates',
    ],
  },

  compliance: {
    agent_type:              'compliance',
    name:                    'Compliance Agent',
    description:             'Risk & regulation specialist — checks documents, flags issues, and ensures adherence to relevant regulations.',
    supported_channels:      ['email', 'slack', 'teams', 'web_widget', 'api'],
    supported_media:         ['text', 'document'],
    can_escalate:            true,
    can_book_appointments:   false,
    can_process_payments:    false,
    can_send_files:          true,
    languages:               ['English'],
    model:                   'gemini-2.5-pro',
    avg_response_ms:         5000,
    max_tokens:              900,
    use_cases:               [
      'Contract & document review',
      'Regulatory compliance checks',
      'Risk identification',
      'Policy interpretation',
      'GDPR / data protection queries',
    ],
    limitations:             [
      'Informational only — not legal advice',
      'Must be reviewed by qualified legal counsel',
      'Jurisdiction-specific limits apply',
    ],
  },

  content: {
    agent_type:              'content',
    name:                    'Content Agent',
    description:             'Brand storyteller — creates on-brand copy for social media, email campaigns, and marketing materials.',
    supported_channels:      ['slack', 'teams', 'email', 'api', 'web_widget'],
    supported_media:         ['text', 'image'],
    can_escalate:            false,
    can_book_appointments:   false,
    can_process_payments:    false,
    can_send_files:          true,
    languages:               ['English', 'Urdu', 'Arabic'],
    model:                   'gemini-2.0-flash',
    avg_response_ms:         1200,
    max_tokens:              600,
    use_cases:               [
      'Social media post creation',
      'Email marketing copy',
      'Product descriptions',
      'Blog outlines & drafts',
      'Ad copy & CTAs',
    ],
    limitations:             [
      'Cannot publish directly to platforms',
      'Image generation not supported',
      'Brand voice improves with more context',
    ],
  },
}

/** Returns capabilities for a given agent type, normalising _agent suffix */
export function getAgentCapabilities(agentType: string): AgentCapability | null {
  const normalised = agentType.replace(/_agent$/, '')
  return AGENT_CAPABILITIES[normalised] ?? null
}

/** Returns true if agent supports a given channel */
export function agentSupportsChannel(agentType: string, channel: ChannelType): boolean {
  const cap = getAgentCapabilities(agentType)
  return cap?.supported_channels.includes(channel) ?? false
}

/** Returns true if agent supports a given media type */
export function agentSupportsMedia(agentType: string, mediaType: string): boolean {
  const cap = getAgentCapabilities(agentType)
  return cap?.supported_media.includes(mediaType as AgentCapability['supported_media'][number]) ?? false
}
