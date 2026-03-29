import {
  Html, Head, Body, Container, Section, Row, Column,
  Heading, Text, Button, Hr, Preview,
} from '@react-email/components'

interface DailyDigestProps {
  businessName: string
  date: string
  stats: {
    interactions: number
    hotLeads: number
    escalations: number
    topAgent: string
    topChannel: string
  }
  appUrl: string
}

export function DailyDigest({ businessName, date, stats, appUrl }: DailyDigestProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>📊 Your LYCHO Daily Brief — {date}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>LYCHO</Text>
          </Section>

          <Section style={heroBanner}>
            <Text style={dateLabel}>{date}</Text>
            <Heading style={heroHeading}>Your Daily Brief</Heading>
            <Text style={heroSubtext}>Here&apos;s what happened yesterday for {businessName}.</Text>
          </Section>

          {/* Stats Grid */}
          <Section style={statsSection}>
            <Text style={sectionLabel}>YESTERDAY&apos;S PERFORMANCE</Text>
            <Row style={statsRow}>
              <Column style={statCell}>
                <Text style={statNumber}>{stats.interactions}</Text>
                <Text style={statLabel}>Interactions</Text>
              </Column>
              <Column style={statCell}>
                <Text style={{ ...statNumber, color: '#C9A84C' }}>{stats.hotLeads}</Text>
                <Text style={statLabel}>🔥 Hot Leads</Text>
              </Column>
              <Column style={statCell}>
                <Text style={{ ...statNumber, color: '#f87171' }}>{stats.escalations}</Text>
                <Text style={statLabel}>⚡ Escalations</Text>
              </Column>
            </Row>
          </Section>

          {/* Highlights */}
          <Section style={highlightsSection}>
            <Text style={sectionLabel}>HIGHLIGHTS</Text>
            <Row style={highlightRow}>
              <Column style={highlightCell}>
                <div style={highlightBox}>
                  <Text style={highlightTitle}>Top Performing Agent</Text>
                  <Text style={highlightValue}>{stats.topAgent}</Text>
                </div>
              </Column>
              <Column style={highlightCell}>
                <div style={highlightBox}>
                  <Text style={highlightTitle}>Most Active Channel</Text>
                  <Text style={highlightValue}>{stats.topChannel}</Text>
                </div>
              </Column>
            </Row>
          </Section>

          <Section style={ctaSection}>
            <Button style={ctaButton} href={`${appUrl}/dashboard`}>
              View Full Report →
            </Button>
          </Section>

          <Hr style={divider} />

          <Section>
            <Text style={footer}>
              Powered by <span style={highlight}>LYCHO</span> — Intelligence. Transmitted.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default DailyDigest

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
  borderBottom: '1px solid rgba(201,168,76,0.1)',
  padding: '28px 32px',
}

const dateLabel = {
  fontSize: '11px',
  letterSpacing: '0.3em',
  color: '#7a6130',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
}

const heroHeading = {
  fontSize: '30px',
  color: '#F0EBE1',
  margin: '0 0 8px',
  fontWeight: 600,
}

const heroSubtext = { fontSize: '14px', color: '#6b6b6b', margin: 0 }
const highlight = { color: '#C9A84C' }

const statsSection = { padding: '24px 32px', borderBottom: '1px solid #2a2a2a' }

const sectionLabel = {
  fontSize: '10px',
  letterSpacing: '0.3em',
  color: '#6b6b6b',
  textTransform: 'uppercase' as const,
  margin: '0 0 16px',
}

const statsRow = { width: '100%' }

const statCell = {
  textAlign: 'center' as const,
  padding: '16px',
  background: '#1c1c1c',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
}

const statNumber = {
  fontSize: '36px',
  fontWeight: 700,
  color: '#F0EBE1',
  margin: '0 0 4px',
  lineHeight: '1',
}

const statLabel = { fontSize: '12px', color: '#6b6b6b', margin: 0 }

const highlightsSection = { padding: '20px 32px', borderBottom: '1px solid #2a2a2a' }

const highlightRow = { width: '100%', gap: '12px' }

const highlightCell = { padding: '0 6px' }

const highlightBox = {
  background: '#1c1c1c',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
  padding: '16px',
}

const highlightTitle = {
  fontSize: '10px',
  letterSpacing: '0.2em',
  color: '#6b6b6b',
  textTransform: 'uppercase' as const,
  margin: '0 0 6px',
}

const highlightValue = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#C9A84C',
  margin: 0,
  textTransform: 'capitalize' as const,
}

const ctaSection = { padding: '28px 32px', textAlign: 'center' as const }

const ctaButton = {
  backgroundColor: '#C9A84C',
  color: '#070707',
  padding: '14px 32px',
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
