import type { TriggerType, ActionType } from './automation-engine'

export interface AutomationTemplate {
  id: string
  name: string
  description: string
  category: 'leads' | 'conversations' | 'sentiment' | 'agents' | 'schedule'
  trigger: { type: TriggerType; filters?: Record<string, unknown> }
  steps: Array<{ id: string; type: ActionType; config: Record<string, unknown> }>
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: 'hot-lead-to-slack',
    name: 'Hot Lead → Slack Alert',
    description: 'Get instant Slack notification when a lead scores 85+',
    category: 'leads',
    trigger: { type: 'lead.hot_detected' },
    steps: [{
      id: 'step-1',
      type: 'send_slack',
      config: {
        webhook_url: '',
        message: '🔥 Hot lead: {{contact_name}} scored {{lead_score}}/100 on {{channel}}',
      },
    }],
  },
  {
    id: 'escalation-to-webhook',
    name: 'Escalation → Webhook',
    description: 'Send escalated conversations to any external system',
    category: 'conversations',
    trigger: { type: 'conversation.escalated' },
    steps: [{
      id: 'step-1',
      type: 'send_webhook',
      config: { url: '', method: 'POST', payload: {} },
    }],
  },
  {
    id: 'hot-lead-to-zapier',
    name: 'Hot Lead → Zapier',
    description: 'Send hot leads to 8000+ apps via Zapier',
    category: 'leads',
    trigger: { type: 'lead.hot_detected' },
    steps: [{
      id: 'step-1',
      type: 'send_to_zapier',
      config: { webhook_url: '' },
    }],
  },
  {
    id: 'frustrated-customer-alert',
    name: 'Frustrated Customer → Email',
    description: 'Get emailed when a customer shows frustration',
    category: 'sentiment',
    trigger: { type: 'sentiment.frustrated' },
    steps: [{
      id: 'step-1',
      type: 'send_email',
      config: {
        to: '',
        subject: '⚠️ Frustrated customer on {{channel}}',
        body: 'Customer {{contact_name}} seems frustrated. View conversation: {{dashboard_url}}',
      },
    }],
  },
  {
    id: 'daily-digest-automation',
    name: 'Daily Business Digest',
    description: 'Get daily summary of all agent activity',
    category: 'schedule',
    trigger: { type: 'schedule.daily' },
    steps: [{
      id: 'step-1',
      type: 'send_email',
      config: {
        to: '',
        subject: '📊 Your LYCHO Daily Brief',
        body: 'Your daily summary is ready. View it at {{dashboard_url}}',
      },
    }],
  },
  {
    id: 'new-conversation-to-n8n',
    name: 'New Conversation → n8n',
    description: 'Trigger n8n workflows on every new conversation',
    category: 'conversations',
    trigger: { type: 'conversation.created' },
    steps: [{
      id: 'step-1',
      type: 'send_to_n8n',
      config: { webhook_url: '' },
    }],
  },
  {
    id: 'hot-lead-to-make',
    name: 'Hot Lead → Make Scenario',
    description: 'Trigger Make automation on hot leads',
    category: 'leads',
    trigger: { type: 'lead.hot_detected' },
    steps: [{
      id: 'step-1',
      type: 'send_to_make',
      config: { webhook_url: '' },
    }],
  },
  {
    id: 'agent-error-alert',
    name: 'Agent Error → Slack',
    description: 'Get notified immediately when an agent errors',
    category: 'agents',
    trigger: { type: 'agent.error' },
    steps: [{
      id: 'step-1',
      type: 'send_slack',
      config: {
        webhook_url: '',
        message: '🚨 Agent error: {{agent_name}} failed on {{channel}}',
      },
    }],
  },
  {
    id: 'resolved-to-webhook',
    name: 'Resolved Conversation → CRM',
    description: 'Update your CRM when conversations are resolved',
    category: 'conversations',
    trigger: { type: 'conversation.resolved' },
    steps: [{
      id: 'step-1',
      type: 'send_webhook',
      config: { url: '', method: 'POST', payload: { contact: '{{contact_name}}', resolved: true } },
    }],
  },
  {
    id: 'weekly-roi-report',
    name: 'Weekly ROI Report',
    description: 'Get weekly ROI summary every Monday morning',
    category: 'schedule',
    trigger: { type: 'schedule.weekly' },
    steps: [{
      id: 'step-1',
      type: 'send_email',
      config: {
        to: '',
        subject: '💰 Your LYCHO Weekly ROI Report',
        body: 'Your weekly ROI report is ready.',
      },
    }],
  },
]

export const TEMPLATE_CATEGORIES = ['all', 'leads', 'conversations', 'sentiment', 'agents', 'schedule'] as const
