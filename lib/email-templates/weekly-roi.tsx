import {
  Html, Head, Body, Container, Section, Row, Column,
  Heading, Text, Button, Hr, Preview,
} from '@react-email/components'

interface AgentPerformance {
  name: string
  interactions: number
  hotLeads: number
  revenue: number
}

interface WeeklyROIProps {
  businessName: string
  weekLabel: string
  totalValuePkr: number
  stats: {
    interactions: number
    hotLeads: number
    escalations: number
    avgResponseTimeMs: number
  }
  agentPerformance: AgentPerformance[]
  appUrl: string
}

export function WeeklyROI({
  businessName,
  weekLabel,
  totalValuePkr,
  stats,
  agentPerformance,
  appUrl,
}: WeeklyROIProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>💰 LYCHO delivered PKR {totalValuePkr.toLocaleString()} in value this week</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>LYCHO</Text>
          </Section>

          {/* ROI Hero */}
          <Section style={heroBanner}>
            <Text style={weekLabelStyle}>{weekLabel}</Text>
            <Text style={roiLabel}>LYCHO DELIVERED</Text>
            <Heading style={roiValue}>PKR {totalValuePkr.toLocaleString()}</Heading>
            <Text style={roiSubtext}>in measurable value for {businessName}</Text>
          </Section>

          {/* Weekly Stats */}
          <Section style={statsSection}>
            <Text style={sectionLabel}>WEEKLY SUMMARY</Text>
            <Row>
              <Column style={statCell}>
                <Text style={statNumber}>{stats.interactions}</Text>
                <Text style={statLabelStyle}>Interactions</Text>
              </Column>
              <Column style={statCell}>
                <Text style={{ ...statNumber, color: '#C9A84C' }}>{stats.hotLeads}</Text>
                <Text style={statLabelStyle}>🔥 Hot Leads</Text>
              </Column>
              <Column style={statCell}>
                <Text style={{ ...statNumber, color: '#f87171' }}>{stats.escalations}</Text>
                <Text style={statLabelStyle}>⚡ Escalations</Text>
              </Column>
              <Column style={statCell}>
                <Text style={{ ...statNumber, color: '#4ade80' }}>
                  {(stats.avgResponseTimeMs / 1000).toFixed(1)}s
                </Text>
                <Text style={statLabelStyle}>Avg Response</Text>
              </Column>
            </Row>
          </Section>

          {/* Agent Performance Table */}
          {agentPerformance.length > 0 && (
            <Section style={tableSection}>
              <Text style={sectionLabel}>AGENT PERFORMANCE</Text>
              {/* Header */}
              <Row style={tableHeader}>
                <Column style={tableCol}>
                  <Text style={tableHeaderText}>AGENT</Text>
                </Column>
                <Column style={tableColSmall}>
                  <Text style={tableHeaderText}>INTERACTIONS</Text>
                </Column>
                <Column style={tableColSmall}>
                  <Text style={tableHeaderText}>HOT LEADS</Text>
                </Column>
                <Column style={tableColSmall}>
                  <Text style={tableHeaderText}>REVENUE</Text>
                </Column>
              </Row>
              {agentPerformance.map((agent, i) => (
                <Row key={i} style={i % 2 === 0 ? tableRowEven : tableRowOdd}>
                  <Column style={tableCol}>
                    <Text style={tableCell}>{agent.name}</Text>
                  </Column>
                  <Column style={tableColSmall}>
                    <Text style={tableCell}>{agent.interactions}</Text>
                  </Column>
                  <Column style={tableColSmall}>
                    <Text style={{ ...tableCell, color: '#C9A84C' }}>{agent.hotLeads}</Text>
                  </Column>
                  <Column style={tableColSmall}>
                    <Text style={tableCell}>PKR {agent.revenue.toLocaleString()}</Text>
                  </Column>
                </Row>
              ))}
            </Section>
          )}

          <Section style={ctaSection}>
            <Button style={ctaButton} href={`${appUrl}/dashboard`}>
              See Full Analytics →
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

export default WeeklyROI

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
  background: 'rgba(201,168,76,0.05)',
  borderBottom: '1px solid rgba(201,168,76,0.15)',
  padding: '28px 32px',
  textAlign: 'center' as const,
}

const weekLabelStyle = {
  fontSize: '11px',
  letterSpacing: '0.3em',
  color: '#7a6130',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
}

const roiLabel = {
  fontSize: '11px',
  letterSpacing: '0.3em',
  color: '#6b6b6b',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px',
}

const roiValue = {
  fontSize: '42px',
  color: '#C9A84C',
  margin: '0 0 4px',
  fontWeight: 700,
  lineHeight: '1.1',
}

const roiSubtext = { fontSize: '14px', color: '#6b6b6b', margin: 0 }

const statsSection = { padding: '24px 32px', borderBottom: '1px solid #2a2a2a' }

const sectionLabel = {
  fontSize: '10px',
  letterSpacing: '0.3em',
  color: '#6b6b6b',
  textTransform: 'uppercase' as const,
  margin: '0 0 16px',
}

const statCell = {
  textAlign: 'center' as const,
  padding: '12px',
  background: '#1c1c1c',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
}

const statNumber = {
  fontSize: '28px',
  fontWeight: 700,
  color: '#F0EBE1',
  margin: '0 0 4px',
  lineHeight: '1',
}

const statLabelStyle = { fontSize: '11px', color: '#6b6b6b', margin: 0 }

const tableSection = { padding: '20px 32px', borderBottom: '1px solid #2a2a2a' }

const tableHeader = {
  background: '#1c1c1c',
  borderBottom: '1px solid #2a2a2a',
  padding: '8px 0',
}

const tableHeaderText = {
  fontSize: '9px',
  letterSpacing: '0.2em',
  color: '#6b6b6b',
  textTransform: 'uppercase' as const,
  margin: 0,
}

const tableCol = { padding: '10px 8px' }
const tableColSmall = { padding: '10px 8px', textAlign: 'right' as const }

const tableRowEven = { background: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }
const tableRowOdd = { background: '#141414', borderBottom: '1px solid #2a2a2a' }

const tableCell = { fontSize: '13px', color: '#F0EBE1', margin: 0 }

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
