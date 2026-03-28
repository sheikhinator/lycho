export interface CatalogueAgent {
  type: string
  name: string
  description: string
  icon: string
  channels?: string[]
  status: 'available' | 'coming_soon'
}

export interface AgentCatalogue {
  core: CatalogueAgent[]
  business_suite: CatalogueAgent[]
  sectors: Record<string, CatalogueAgent[]>
}

export const AGENT_CATALOGUE: AgentCatalogue = {
  core: [
    { type: 'intake',      name: 'Intake Agent',      description: 'Handles all inbound messages 24/7 across every channel',          icon: 'MessageSquare', channels: ['whatsapp','email','web','sms'], status: 'available' },
    { type: 'research',    name: 'Research Agent',    description: 'Monitors markets, competitors, and regulations in real time',      icon: 'Search',        channels: ['web'],                          status: 'available' },
    { type: 'operations',  name: 'Operations Agent',  description: 'Automates workflows, scheduling, and follow-ups end to end',       icon: 'Settings',      channels: ['email'],                        status: 'available' },
    { type: 'client',      name: 'Client Agent',      description: 'Manages customer relationships and runs retention sequences',      icon: 'Users',         channels: ['whatsapp','email'],             status: 'available' },
    { type: 'analyst',     name: 'Analyst Agent',     description: 'Tracks performance, calculates health scores, predicts churn',    icon: 'BarChart2',     channels: ['web'],                          status: 'available' },
    { type: 'compliance',  name: 'Compliance Agent',  description: 'Monitors regulatory changes specific to your sector',             icon: 'Shield',        channels: ['email'],                        status: 'available' },
    { type: 'content',     name: 'Content Agent',     description: 'Creates and publishes content across all your channels',          icon: 'FileText',      channels: ['email','web'],                  status: 'available' },
  ],
  business_suite: [
    { type: 'sales',             name: 'Sales Agent',             description: 'Qualifies leads and manages pipeline automatically',           icon: 'TrendingUp',   status: 'available' },
    { type: 'hr',                name: 'HR Agent',                description: 'Manages recruitment and employee queries',                     icon: 'Users',        status: 'available' },
    { type: 'finance',           name: 'Finance Agent',           description: 'Tracks invoices and generates financial reports',              icon: 'DollarSign',   status: 'available' },
    { type: 'legal',             name: 'Legal Agent',             description: 'Reviews contracts and monitors legal compliance',              icon: 'FileText',     status: 'available' },
    { type: 'scheduling',        name: 'Scheduling Agent',        description: 'Manages appointments and calendars across channels',           icon: 'Calendar',     status: 'available' },
    { type: 'social_media',      name: 'Social Media Agent',      description: 'Manages all social channels and engagement',                  icon: 'Share2',       status: 'available' },
    { type: 'email_marketing',   name: 'Email Marketing Agent',   description: 'Runs targeted email campaigns automatically',                 icon: 'Mail',         status: 'available' },
    { type: 'seo',               name: 'SEO Agent',               description: 'Optimises all content for search engines',                    icon: 'Search',       status: 'available' },
    { type: 'customer_success',  name: 'Customer Success Agent',  description: 'Manages onboarding and reduces churn',                        icon: 'Heart',        status: 'available' },
    { type: 'reporting',         name: 'Reporting Agent',         description: 'Generates weekly and monthly business reports',               icon: 'BarChart2',    status: 'available' },
    { type: 'payroll',           name: 'Payroll Agent',           description: 'Processes payroll and manages salary queries',                icon: 'CreditCard',   status: 'available' },
    { type: 'procurement',       name: 'Procurement Agent',       description: 'Manages supplier relationships and purchase orders',          icon: 'ShoppingCart', status: 'available' },
    { type: 'training',          name: 'Training Agent',          description: 'Onboards and trains new team members',                        icon: 'BookOpen',     status: 'available' },
    { type: 'feedback',          name: 'Feedback Agent',          description: 'Collects and analyses customer feedback',                     icon: 'Star',         status: 'available' },
    { type: 'translation',       name: 'Translation Agent',       description: 'Translates content into Urdu, Arabic, and English',          icon: 'Globe',        status: 'available' },
  ],
  sectors: {
    healthcare: [
      { type: 'patient_intake',      name: 'Patient Intake Agent',   description: 'Handles patient registration and triage',          icon: 'Activity', status: 'available' },
      { type: 'appointment_medical', name: 'Appointment Agent',      description: 'Books and manages medical appointments',           icon: 'Calendar', status: 'available' },
      { type: 'prescription',        name: 'Prescription Agent',     description: 'Manages prescription requests and reminders',     icon: 'FileText', status: 'available' },
      { type: 'medical_records',     name: 'Records Agent',          description: 'Manages patient records and history',             icon: 'Archive',  status: 'available' },
    ],
    legal: [
      { type: 'case_intake',      name: 'Case Intake Agent',       description: 'Qualifies and onboards new cases',              icon: 'Briefcase', status: 'available' },
      { type: 'contract_review',  name: 'Contract Review Agent',   description: 'Reviews and flags contract issues',             icon: 'FileText',  status: 'available' },
      { type: 'legal_research',   name: 'Legal Research Agent',    description: 'Researches case law and precedents',            icon: 'Search',    status: 'available' },
      { type: 'court_scheduling', name: 'Court Scheduling Agent',  description: 'Manages court dates and deadlines',             icon: 'Calendar',  status: 'available' },
    ],
    finance: [
      { type: 'kyc',                  name: 'KYC Agent',                   description: 'Handles know-your-customer verification',          icon: 'Shield',        status: 'available' },
      { type: 'fraud_detection',      name: 'Fraud Detection Agent',       description: 'Monitors transactions for anomalies',              icon: 'AlertTriangle', status: 'available' },
      { type: 'financial_reporting',  name: 'Financial Reporting Agent',   description: 'Generates financial statements automatically',     icon: 'BarChart2',     status: 'available' },
      { type: 'loan_processing',      name: 'Loan Processing Agent',       description: 'Handles loan applications and queries',            icon: 'DollarSign',    status: 'available' },
    ],
    real_estate: [
      { type: 'property_inquiry',   name: 'Property Inquiry Agent',   description: 'Handles property enquiries 24/7',              icon: 'Home',       status: 'available' },
      { type: 'viewing_scheduler',  name: 'Viewing Scheduler Agent',  description: 'Books property viewings automatically',        icon: 'Calendar',   status: 'available' },
      { type: 'property_valuation', name: 'Valuation Agent',          description: 'Provides instant property valuations',         icon: 'TrendingUp', status: 'available' },
    ],
    education: [
      { type: 'student_support', name: 'Student Support Agent', description: 'Handles student queries and admin',         icon: 'BookOpen',  status: 'available' },
      { type: 'enrollment',      name: 'Enrollment Agent',      description: 'Manages student enrollment process',        icon: 'UserPlus',  status: 'available' },
      { type: 'fee_collection',  name: 'Fee Collection Agent',  description: 'Manages fee reminders and payments',        icon: 'CreditCard',status: 'available' },
    ],
    ecommerce: [
      { type: 'order_tracking',          name: 'Order Tracking Agent',    description: 'Handles order status and returns',                icon: 'Package',     status: 'available' },
      { type: 'product_recommendation',  name: 'Recommendation Agent',   description: 'Recommends products based on behaviour',         icon: 'Star',        status: 'available' },
      { type: 'cart_recovery',           name: 'Cart Recovery Agent',     description: 'Recovers abandoned carts automatically',         icon: 'ShoppingCart',status: 'available' },
    ],
    hospitality: [
      { type: 'reservation',    name: 'Reservation Agent',    description: 'Manages bookings and cancellations',              icon: 'Calendar', status: 'available' },
      { type: 'guest_services', name: 'Guest Services Agent', description: 'Handles guest requests and feedback',             icon: 'Coffee',   status: 'available' },
      { type: 'housekeeping',   name: 'Housekeeping Agent',   description: 'Manages housekeeping schedules and requests',     icon: 'Home',     status: 'available' },
    ],
    manufacturing: [
      { type: 'inventory',       name: 'Inventory Agent',       description: 'Tracks stock levels and triggers reorders',         icon: 'Package',     status: 'available' },
      { type: 'quality_control', name: 'Quality Control Agent', description: 'Monitors production quality metrics',               icon: 'CheckCircle', status: 'available' },
      { type: 'maintenance',     name: 'Maintenance Agent',     description: 'Schedules and tracks equipment maintenance',        icon: 'Tool',        status: 'available' },
    ],
    food_beverage: [
      { type: 'order_management',  name: 'Order Management Agent',  description: 'Handles orders across all channels',               icon: 'ShoppingBag', status: 'available' },
      { type: 'table_reservation', name: 'Table Reservation Agent', description: 'Manages restaurant reservations',                  icon: 'Calendar',    status: 'available' },
      { type: 'menu_queries',      name: 'Menu Agent',              description: 'Answers menu queries and dietary questions',       icon: 'List',        status: 'available' },
    ],
    logistics: [
      { type: 'shipment_tracking',   name: 'Shipment Tracking Agent',    description: 'Tracks shipments and updates customers',      icon: 'Truck',      status: 'available' },
      { type: 'fleet_management',    name: 'Fleet Management Agent',     description: 'Monitors fleet and driver performance',       icon: 'Map',        status: 'available' },
      { type: 'route_optimisation',  name: 'Route Optimisation Agent',   description: 'Optimises delivery routes in real time',      icon: 'Navigation', status: 'available' },
    ],
    construction: [
      { type: 'project_tracking',   name: 'Project Tracking Agent',    description: 'Monitors construction project progress',  icon: 'BarChart2', status: 'available' },
      { type: 'safety_compliance',  name: 'Safety Compliance Agent',   description: 'Monitors site safety and compliance',     icon: 'Shield',    status: 'available' },
    ],
    insurance: [
      { type: 'claims_processing', name: 'Claims Processing Agent', description: 'Handles insurance claims end to end',    icon: 'FileText',   status: 'available' },
      { type: 'policy_queries',    name: 'Policy Query Agent',      description: 'Answers policy questions instantly',     icon: 'HelpCircle', status: 'available' },
    ],
    automotive: [
      { type: 'service_booking', name: 'Service Booking Agent', description: 'Books vehicle service appointments',        icon: 'Calendar', status: 'available' },
      { type: 'parts_inquiry',   name: 'Parts Inquiry Agent',   description: 'Handles spare parts queries and orders',    icon: 'Settings', status: 'available' },
    ],
    beauty_wellness: [
      { type: 'salon_booking',        name: 'Salon Booking Agent',   description: 'Manages salon and spa appointments',           icon: 'Calendar', status: 'available' },
      { type: 'beauty_consultation',  name: 'Consultation Agent',    description: 'Handles beauty consultation queries',          icon: 'Star',     status: 'available' },
    ],
    agriculture: [
      { type: 'crop_monitoring', name: 'Crop Monitoring Agent',  description: 'Monitors crop health and weather conditions',  icon: 'Sun',        status: 'available' },
      { type: 'market_prices',   name: 'Market Price Agent',     description: 'Tracks commodity prices and market trends',    icon: 'TrendingUp', status: 'available' },
    ],
    nonprofit: [
      { type: 'donor_management',        name: 'Donor Management Agent',  description: 'Manages donor relationships and campaigns',       icon: 'Heart', status: 'available' },
      { type: 'volunteer_coordination',  name: 'Volunteer Agent',         description: 'Coordinates volunteer scheduling and comms',      icon: 'Users', status: 'available' },
    ],
    telecommunications: [
      { type: 'technical_support',  name: 'Technical Support Agent', description: 'Handles technical queries and troubleshooting', icon: 'Wifi',       status: 'available' },
      { type: 'billing_telecom',    name: 'Billing Agent',           description: 'Manages billing queries and disputes',           icon: 'CreditCard', status: 'available' },
    ],
    sports_fitness: [
      { type: 'membership_management', name: 'Membership Agent',    description: 'Manages gym memberships and renewals',              icon: 'Award',    status: 'available' },
      { type: 'class_booking',         name: 'Class Booking Agent', description: 'Books fitness classes and personal training',       icon: 'Calendar', status: 'available' },
    ],
  },
}

// Normalise sector keys to match tenant sector values (lowercase, underscored)
export function normaliseSectorKey(sector: string | null | undefined): string | null {
  if (!sector) return null
  return sector.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
}

export function getSectorAgents(sector: string | null | undefined): CatalogueAgent[] {
  const key = normaliseSectorKey(sector)
  if (!key) return []
  // Try exact match, then partial match
  if (AGENT_CATALOGUE.sectors[key]) return AGENT_CATALOGUE.sectors[key]
  const partial = Object.keys(AGENT_CATALOGUE.sectors).find(k => k.includes(key) || key.includes(k))
  return partial ? AGENT_CATALOGUE.sectors[partial] : []
}
