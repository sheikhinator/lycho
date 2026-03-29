import {
  Html, Head, Body, Container, Section, Row, Column,
  Heading, Text, Button, Hr, Preview,
} from '@react-email/components'

interface TrialExpiryProps {
  businessName: string
  daysRemaining: number
  appUrl: string
}

export function TrialExpiry({ businessName, daysRemaining, appUrl }: TrialExpiryProps) {
  const urgent = daysRemaining <= 2
  const accentColor = urgent ? '#f87171' : '#C9A84C'

  const featuresAtRisk = [
    'All active AI agents paused',
    'Conversation history archived',
    'Lead scoring disabled',
    'Telegram & WhatsApp disconnected',
    'Real-time activity feed frozen',
  ]

  return (
    <Html lang="en">
      <Head />
      <Preview>{`Your LYCHO trial expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>LYCHO</Text>
          </Section>

          <Section style={{ ...heroBanner, borderBottom: `1px solid ${urgent ? 'rgba(248,113,113,0.2)' : 'rgba(201,168,76,0.15)'}` }}>
            <Text style={{ ...badgeText, color: accentColor }}>
              {urgent ? '🚨 URGENT' : '⏳ TRIAL EXPIRING'}
            </Text>
            <Heading style={heroHeading}>
              {daysRemaining === 0
                ? 'Your trial expires today'
                : `Your trial expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`}
            </Heading>
            <Text style={heroSubtext}>
              Hey {businessName}, your free trial ends soon. Upgrade now to keep your AI agents running.
            </Text>
          </Section>

          {/* What you'll lose */}
          <Section style={loseSection}>
            <Text style={sectionLabel}>WITHOUT UPGRADING YOU LOSE</Text>
            {featuresAtRisk.map((f, i) => (
              <Row key={i} style={featureRow}>
                <Column style={{ width: '20px' }}>
                  <Text style={crossIcon}>✕</Text>
                </Column>
                <Column>
                  <Text style={featureText}>{f}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          {/* Upgrade CTA */}
          <Section style={ctaSection}>
            <Text style={ctaLabel}>Upgrade in 60 seconds. Cancel anytime.</Text>
            <Button style={{ ...ctaButton, backgroundColor: accentColor }} href={`${appUrl}/dashboard/billing`}>
              Upgrade Now →
            </Button>
          </Section>

          <Hr style={divider} />

          <Section>
            <Text style={footer}>
              Powered by <span style={{ color: '#C9A84C' }}>LYCHO</span> — Intelligence. Transmitted.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default TrialExpiry

const body = {
  backgroundColor: '#070707',
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  margin: 0,
  padding: '40px 0',
}

const container = {
  backgroundColor: '#141414',
  borderRadius: '12px',
  border: '1px solid #2a2a2a',
  maxWidth: '600px',
  margin: '0 auto',
  overflow: 'hidden' as const,
}

const logoSection = { padding: '24px 32px 16px', borderBottom: '1px solid #2a2a2a' }
const logoText = {
  fontFamily: '"Bebas Neue", Impact, sans-serif',
  fontSize: '28px',
  letterSpacing: '0.2em',
  color: '#C9A84C',
  margin: 0,
}

const heroBanner = {
  background: 'rgba(201,168,76,0.04)',
  padding: '28px 32px',
}

const badgeText = {
  fontSize: '11px',
  letterSpacing: '0.3em',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
}

const heroHeading = {
  fontSize: '28px',
  color: '#F0EBE1',
  margin: '0 0 8px',
  fontWeight: 600,
}

const heroSubtext = { fontSize: '14px', color: '#6b6b6b', margin: 0 }

const loseSection = { padding: '20px 32px', borderBottom: '1px solid #2a2a2a' }

const sectionLabel = {
  fontSize: '10px',
  letterSpacing: '0.3em',
  color: '#6b6b6b',
  textTransform: 'uppercase' as const,
  margin: '0 0 12px',
}

const featureRow = { marginBottom: '8px', width: '100%' }
const crossIcon = { fontSize: '12px', color: '#f87171', margin: 0 }
const featureText = { fontSize: '13px', color: '#F0EBE1', margin: 0 }

const ctaSection = {
  padding: '28px 32px',
  textAlign: 'center' as const,
}

const ctaLabel = {
  fontSize: '12px',
  color: '#6b6b6b',
  margin: '0 0 16px',
}

const ctaButton = {
  color: '#070707',
  padding: '14px 36px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 700,
  letterSpacing: '0.05em',
  textDecoration: 'none',
  display: 'inline-block',
}

const divider = { borderColor: '#2a2a2a', margin: '0 32px' }

const footer = {
  fontSize: '12px',
  color: '#6b6b6b',
  textAlign: 'center' as const,
  margin: '16px 32px 24px',
}
