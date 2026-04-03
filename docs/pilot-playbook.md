# Pilot Client Playbook

## Overview
This guide covers the process for onboarding and managing pilot clients for LYCHO during Days 36-45.

## Pilot Client Profile
- Small to medium business (10-100 employees)
- Active on WhatsApp Business
- Has existing customer communication workflows
- Willing to provide detailed feedback
- Located in Pakistan (primary) or UAE/UK (secondary)

## Onboarding Steps

### 1. Pre-Onboarding (Day 1)
- [ ] Create demo tenant using `POST /api/demo/seed`
- [ ] Configure WhatsApp connection for their phone number
- [ ] Deploy 3 core agents: Intake, Client, Analyst
- [ ] Set up their business profile in Settings
- [ ] Generate login credentials

### 2. First Meeting (Day 2)
- [ ] Walk through the dashboard
- [ ] Show how to deploy agents
- [ ] Demonstrate WhatsApp integration
- [ ] Explain analytics dashboard
- [ ] Show how to submit feedback (`/dashboard/feedback`)

### 3. Week 1 Monitoring
- [ ] Check their analytics daily
- [ ] Monitor conversation quality
- [ ] Respond to feedback within 4 hours
- [ ] Fix any critical bugs immediately
- [ ] Send weekly summary email

### 4. Week 2 Optimization
- [ ] Review conversation logs for patterns
- [ ] Adjust agent prompts based on real usage
- [ ] Suggest additional agents based on their needs
- [ ] Introduce Nexus automation engine
- [ ] Collect testimonials

### 5. Week 3 Expansion
- [ ] Propose additional channel integrations
- [ ] Discuss paid plan transition
- [ ] Gather case study material
- [ ] Ask for referral to other businesses

## Feedback Collection
- Primary: `/dashboard/feedback` page in the app
- Secondary: Weekly check-in calls
- Tertiary: WhatsApp direct messages to pilot manager

## Success Metrics
- Agent uptime > 99%
- Customer satisfaction score > 4/5
- At least 50 conversations per week
- At least 3 feedback submissions per week
- Zero critical bugs unresolved for > 24 hours

## Troubleshooting

### WhatsApp Not Receiving Messages
1. Check `/api/webhooks/whatsapp/test` endpoint
2. Verify channel_connections table has active entry
3. Confirm Meta app is approved
4. Check webhook URL is correctly set in Meta dashboard

### Agent Not Responding
1. Check agent status is "active"
2. Verify Claude API key is valid
3. Check conversation logs in dashboard
4. Review agent configuration

### Billing Issues
1. Check tenant plan_status in database
2. Verify subscription record exists
3. Test Safepay checkout flow
4. Contact payment provider if needed
