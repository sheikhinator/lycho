export type IntegrationStatus = 'live' | 'coming_soon' | 'beta'
export type IntegrationCategory =
  | 'messaging'
  | 'email'
  | 'crm'
  | 'ecommerce'
  | 'payments'
  | 'helpdesk'
  | 'analytics'
  | 'productivity'
  | 'social'
  | 'voice'
  | 'storage'
  | 'automation'
  | 'calendar'
  | 'accounting'
  | 'hr'

export interface Integration {
  id:          string
  name:        string
  description: string
  category:    IntegrationCategory
  status:      IntegrationStatus
  logo:        string  // emoji or icon identifier
  docs_url?:   string
  tags:        string[]
  popular?:    boolean
}

export const INTEGRATIONS_CATALOGUE: Integration[] = [
  // ─── Messaging ───────────────────────────────────────────────────────────────
  {
    id:          'whatsapp',
    name:        'WhatsApp Business',
    description: 'Connect your WhatsApp Business number via Meta Cloud API. Send & receive messages, media, and templates at scale.',
    category:    'messaging',
    status:      'live',
    logo:        '💬',
    tags:        ['whatsapp', 'meta', 'messaging', 'popular'],
    popular:     true,
  },
  {
    id:          'telegram',
    name:        'Telegram',
    description: 'Deploy a Telegram bot to handle conversations, commands, and media in groups or direct messages.',
    category:    'messaging',
    status:      'live',
    logo:        '✈️',
    tags:        ['telegram', 'bot', 'messaging'],
  },
  {
    id:          'sms_twilio',
    name:        'SMS via Twilio',
    description: 'Send and receive SMS messages through Twilio. Reach customers who prefer text without smartphones.',
    category:    'messaging',
    status:      'live',
    logo:        '📱',
    tags:        ['sms', 'twilio', 'text message'],
  },
  {
    id:          'slack',
    name:        'Slack',
    description: 'Add LYCHO agents to your Slack workspace for internal team automation and customer support workflows.',
    category:    'messaging',
    status:      'live',
    logo:        '⚡',
    tags:        ['slack', 'team', 'internal'],
    popular:     true,
  },
  {
    id:          'teams',
    name:        'Microsoft Teams',
    description: 'Integrate agents into Teams channels and chats for enterprise communication workflows.',
    category:    'messaging',
    status:      'coming_soon',
    logo:        '🟦',
    tags:        ['microsoft', 'teams', 'enterprise'],
  },
  {
    id:          'discord',
    name:        'Discord',
    description: 'Deploy community support bots in Discord servers for gaming, creator economy, and tech communities.',
    category:    'messaging',
    status:      'coming_soon',
    logo:        '🎮',
    tags:        ['discord', 'community', 'gaming'],
  },
  {
    id:          'signal',
    name:        'Signal',
    description: 'Privacy-first messaging for high-trust customer conversations requiring end-to-end encryption.',
    category:    'messaging',
    status:      'coming_soon',
    logo:        '🔒',
    tags:        ['signal', 'privacy', 'secure'],
  },

  // ─── Social ───────────────────────────────────────────────────────────────────
  {
    id:          'instagram_dm',
    name:        'Instagram DMs',
    description: 'Automate Instagram Direct Message responses. Handle enquiries from posts, stories, and reels.',
    category:    'social',
    status:      'live',
    logo:        '📸',
    tags:        ['instagram', 'meta', 'social', 'dms'],
    popular:     true,
  },
  {
    id:          'facebook_messenger',
    name:        'Facebook Messenger',
    description: 'Respond to Facebook Page messages automatically. Integrate with your Meta Business Suite.',
    category:    'social',
    status:      'live',
    logo:        '👥',
    tags:        ['facebook', 'meta', 'messenger', 'social'],
  },
  {
    id:          'twitter_dm',
    name:        'X (Twitter) DMs',
    description: 'Handle X Direct Messages at scale. Auto-reply to customer enquiries and support requests.',
    category:    'social',
    status:      'coming_soon',
    logo:        '🐦',
    tags:        ['twitter', 'x', 'social', 'dm'],
  },
  {
    id:          'linkedin',
    name:        'LinkedIn Messages',
    description: 'Automate LinkedIn message responses for B2B lead generation and prospect follow-ups.',
    category:    'social',
    status:      'coming_soon',
    logo:        '💼',
    tags:        ['linkedin', 'b2b', 'professional'],
  },

  // ─── Email ────────────────────────────────────────────────────────────────────
  {
    id:          'resend',
    name:        'Resend',
    description: 'Send transactional and marketing emails via Resend. Includes open tracking and templates.',
    category:    'email',
    status:      'live',
    logo:        '📧',
    tags:        ['email', 'resend', 'transactional'],
    popular:     true,
  },
  {
    id:          'gmail',
    name:        'Gmail',
    description: 'Connect Gmail inboxes to automatically triage, respond to, and categorise incoming emails.',
    category:    'email',
    status:      'coming_soon',
    logo:        '📩',
    tags:        ['gmail', 'google', 'email'],
  },
  {
    id:          'outlook',
    name:        'Outlook / Office 365',
    description: 'Integrate with Microsoft Outlook for enterprise email automation and calendar-linked workflows.',
    category:    'email',
    status:      'coming_soon',
    logo:        '📬',
    tags:        ['outlook', 'microsoft', 'office365', 'email'],
  },
  {
    id:          'mailchimp',
    name:        'Mailchimp',
    description: 'Sync contacts and trigger email campaigns based on conversation outcomes and lead scores.',
    category:    'email',
    status:      'coming_soon',
    logo:        '🐒',
    tags:        ['mailchimp', 'email marketing', 'campaigns'],
  },

  // ─── CRM ──────────────────────────────────────────────────────────────────────
  {
    id:          'hubspot',
    name:        'HubSpot CRM',
    description: 'Sync contacts, deals, and notes bidirectionally with HubSpot. Auto-create deals from hot leads.',
    category:    'crm',
    status:      'coming_soon',
    logo:        '🔶',
    tags:        ['hubspot', 'crm', 'deals', 'contacts'],
    popular:     true,
  },
  {
    id:          'salesforce',
    name:        'Salesforce',
    description: 'Enterprise CRM integration — push leads, update opportunities, and log activities automatically.',
    category:    'crm',
    status:      'coming_soon',
    logo:        '☁️',
    tags:        ['salesforce', 'crm', 'enterprise', 'leads'],
  },
  {
    id:          'zoho_crm',
    name:        'Zoho CRM',
    description: 'Connect to Zoho CRM for SME-focused lead management and pipeline synchronisation.',
    category:    'crm',
    status:      'coming_soon',
    logo:        '🔵',
    tags:        ['zoho', 'crm', 'sme'],
  },
  {
    id:          'pipedrive',
    name:        'Pipedrive',
    description: 'Push qualified leads into Pipedrive pipelines and update deal stages from conversation outcomes.',
    category:    'crm',
    status:      'coming_soon',
    logo:        '🔧',
    tags:        ['pipedrive', 'crm', 'pipeline', 'sales'],
  },

  // ─── E-commerce ───────────────────────────────────────────────────────────────
  {
    id:          'shopify',
    name:        'Shopify',
    description: 'Access order status, inventory, and customer data from Shopify to power intelligent support.',
    category:    'ecommerce',
    status:      'coming_soon',
    logo:        '🛍️',
    tags:        ['shopify', 'ecommerce', 'orders', 'inventory'],
    popular:     true,
  },
  {
    id:          'woocommerce',
    name:        'WooCommerce',
    description: 'Connect to WooCommerce stores for order tracking, product queries, and refund handling.',
    category:    'ecommerce',
    status:      'coming_soon',
    logo:        '🛒',
    tags:        ['woocommerce', 'wordpress', 'ecommerce'],
  },
  {
    id:          'daraz',
    name:        'Daraz',
    description: "Pakistan and South Asia's largest marketplace — automate seller support and buyer queries.",
    category:    'ecommerce',
    status:      'coming_soon',
    logo:        '🏪',
    tags:        ['daraz', 'pakistan', 'marketplace', 'ecommerce'],
  },

  // ─── Payments ─────────────────────────────────────────────────────────────────
  {
    id:          'stripe',
    name:        'Stripe',
    description: 'Check payment status, trigger refunds, and create payment links from within conversations.',
    category:    'payments',
    status:      'coming_soon',
    logo:        '💳',
    tags:        ['stripe', 'payments', 'refunds'],
    popular:     true,
  },
  {
    id:          'easypaisa',
    name:        'EasyPaisa',
    description: "Pakistan's leading mobile wallet — accept payments and verify transactions via EasyPaisa API.",
    category:    'payments',
    status:      'coming_soon',
    logo:        '📲',
    tags:        ['easypaisa', 'pakistan', 'mobile wallet', 'payments'],
  },
  {
    id:          'jazzcash',
    name:        'JazzCash',
    description: 'Integrate JazzCash for PKR payments, order confirmations, and automated payment reminders.',
    category:    'payments',
    status:      'coming_soon',
    logo:        '💰',
    tags:        ['jazzcash', 'pakistan', 'mobile money', 'payments'],
  },
  {
    id:          'bank_transfer',
    name:        'Bank Transfer (Pakistan)',
    description: 'Verify IBFT and Raast transactions, confirm payments, and update order statuses automatically.',
    category:    'payments',
    status:      'coming_soon',
    logo:        '🏦',
    tags:        ['ibft', 'raast', 'bank', 'pakistan', 'payments'],
  },

  // ─── Helpdesk ─────────────────────────────────────────────────────────────────
  {
    id:          'zendesk',
    name:        'Zendesk',
    description: 'Create, update, and resolve Zendesk tickets from LYCHO conversations. Full bidirectional sync.',
    category:    'helpdesk',
    status:      'coming_soon',
    logo:        '🎫',
    tags:        ['zendesk', 'helpdesk', 'tickets', 'support'],
  },
  {
    id:          'freshdesk',
    name:        'Freshdesk',
    description: 'Auto-create Freshdesk tickets from unresolved conversations and sync statuses in real-time.',
    category:    'helpdesk',
    status:      'coming_soon',
    logo:        '🍀',
    tags:        ['freshdesk', 'tickets', 'support', 'helpdesk'],
  },
  {
    id:          'intercom',
    name:        'Intercom',
    description: 'Supplement Intercom with AI-powered first-line responses. Hand off to human agents seamlessly.',
    category:    'helpdesk',
    status:      'coming_soon',
    logo:        '💬',
    tags:        ['intercom', 'chat', 'support', 'live chat'],
  },

  // ─── Calendar & Scheduling ───────────────────────────────────────────────────
  {
    id:          'google_calendar',
    name:        'Google Calendar',
    description: 'Check availability and book appointments directly from conversations. Sync in real-time.',
    category:    'calendar',
    status:      'coming_soon',
    logo:        '📅',
    tags:        ['google', 'calendar', 'appointments', 'booking'],
    popular:     true,
  },
  {
    id:          'calendly',
    name:        'Calendly',
    description: 'Share Calendly links automatically when prospects want to book a call. No manual sharing needed.',
    category:    'calendar',
    status:      'coming_soon',
    logo:        '🗓️',
    tags:        ['calendly', 'scheduling', 'meetings'],
  },

  // ─── Analytics ────────────────────────────────────────────────────────────────
  {
    id:          'google_analytics',
    name:        'Google Analytics 4',
    description: 'Track conversation-to-conversion funnels and push custom events to GA4 from LYCHO.',
    category:    'analytics',
    status:      'coming_soon',
    logo:        '📊',
    tags:        ['google', 'analytics', 'ga4', 'tracking'],
  },
  {
    id:          'mixpanel',
    name:        'Mixpanel',
    description: 'Push conversation events to Mixpanel for cohort analysis and retention tracking.',
    category:    'analytics',
    status:      'coming_soon',
    logo:        '📈',
    tags:        ['mixpanel', 'analytics', 'events', 'retention'],
  },

  // ─── Productivity ─────────────────────────────────────────────────────────────
  {
    id:          'notion',
    name:        'Notion',
    description: 'Append conversation summaries and leads to Notion databases. Build your knowledge base automatically.',
    category:    'productivity',
    status:      'coming_soon',
    logo:        '📝',
    tags:        ['notion', 'database', 'notes', 'knowledge'],
  },
  {
    id:          'google_sheets',
    name:        'Google Sheets',
    description: 'Export conversation data, leads, and metrics to Google Sheets for custom reporting.',
    category:    'productivity',
    status:      'coming_soon',
    logo:        '📋',
    tags:        ['google', 'sheets', 'spreadsheet', 'export'],
  },
  {
    id:          'airtable',
    name:        'Airtable',
    description: 'Sync contacts, leads, and conversation metadata into Airtable bases and views.',
    category:    'productivity',
    status:      'coming_soon',
    logo:        '🗃️',
    tags:        ['airtable', 'database', 'crm', 'no-code'],
  },
  {
    id:          'zapier',
    name:        'Zapier',
    description: 'Connect LYCHO to 5,000+ apps via Zapier. Trigger zaps from conversation events and lead scores.',
    category:    'automation',
    status:      'coming_soon',
    logo:        '⚡',
    tags:        ['zapier', 'automation', 'no-code', 'integrations'],
    popular:     true,
  },
  {
    id:          'make',
    name:        'Make (Integromat)',
    description: 'Build complex multi-step automations with LYCHO as a trigger or action in Make scenarios.',
    category:    'automation',
    status:      'coming_soon',
    logo:        '🔄',
    tags:        ['make', 'integromat', 'automation', 'workflow'],
  },

  // ─── Voice ────────────────────────────────────────────────────────────────────
  {
    id:          'twilio_voice',
    name:        'Twilio Voice',
    description: 'Enable AI-powered voice calls — answer, transcribe, and respond to phone calls automatically.',
    category:    'voice',
    status:      'coming_soon',
    logo:        '📞',
    tags:        ['twilio', 'voice', 'phone', 'calls'],
  },

  // ─── Storage ──────────────────────────────────────────────────────────────────
  {
    id:          'google_drive',
    name:        'Google Drive',
    description: 'Access and share documents from Google Drive during conversations. Auto-save conversation logs.',
    category:    'storage',
    status:      'coming_soon',
    logo:        '💾',
    tags:        ['google', 'drive', 'documents', 'files'],
  },
  {
    id:          'dropbox',
    name:        'Dropbox',
    description: 'Share Dropbox files with customers and auto-archive conversation attachments.',
    category:    'storage',
    status:      'coming_soon',
    logo:        '📦',
    tags:        ['dropbox', 'files', 'storage'],
  },

  // ─── Accounting ───────────────────────────────────────────────────────────────
  {
    id:          'quickbooks',
    name:        'QuickBooks',
    description: 'Create invoices and check payment status from within customer conversations.',
    category:    'accounting',
    status:      'coming_soon',
    logo:        '🧾',
    tags:        ['quickbooks', 'accounting', 'invoices', 'payments'],
  },
  {
    id:          'xero',
    name:        'Xero',
    description: 'Automate invoice creation, payment reminders, and financial queries via Xero integration.',
    category:    'accounting',
    status:      'coming_soon',
    logo:        '💹',
    tags:        ['xero', 'accounting', 'finance'],
  },

  // ─── HR ───────────────────────────────────────────────────────────────────────
  {
    id:          'hr_bot',
    name:        'HR Self-Service',
    description: 'Answer employee HR queries — leave balances, payroll enquiries, and policy questions — automatically.',
    category:    'hr',
    status:      'coming_soon',
    logo:        '👔',
    tags:        ['hr', 'employees', 'leave', 'payroll', 'internal'],
  },
]

export const INTEGRATION_CATEGORIES: { id: IntegrationCategory; label: string }[] = [
  { id: 'messaging',    label: 'Messaging' },
  { id: 'social',       label: 'Social Media' },
  { id: 'email',        label: 'Email' },
  { id: 'crm',          label: 'CRM' },
  { id: 'ecommerce',    label: 'E-Commerce' },
  { id: 'payments',     label: 'Payments' },
  { id: 'helpdesk',     label: 'Helpdesk' },
  { id: 'calendar',     label: 'Calendar' },
  { id: 'analytics',    label: 'Analytics' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'automation',   label: 'Automation' },
  { id: 'voice',        label: 'Voice' },
  { id: 'storage',      label: 'Storage' },
  { id: 'accounting',   label: 'Accounting' },
  { id: 'hr',           label: 'HR' },
]

export function getIntegrationsByCategory(category: IntegrationCategory): Integration[] {
  return INTEGRATIONS_CATALOGUE.filter(i => i.category === category)
}

export function getPopularIntegrations(): Integration[] {
  return INTEGRATIONS_CATALOGUE.filter(i => i.popular)
}

export function searchIntegrations(query: string): Integration[] {
  const q = query.toLowerCase()
  return INTEGRATIONS_CATALOGUE.filter(
    i =>
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.tags.some(t => t.includes(q)),
  )
}
