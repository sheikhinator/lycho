import {
  Html, Head, Body, Container, Section, Row, Column,
  Heading, Text, Button, Hr, Preview,
} from '@react-email/components'

interface EscalationAlertProps {
  businessName: string
  contactIdentifier: string
  channel: string
  conversationId: string
  escalationReason: string
  conversationSnippet: Array<{ role: string; content: string }>
  appUrl: string
}

export function EscalationAlert({
  businessName,
  contactIdentifier,
  channel,
  conversationId,
  escalationReason,
  conversationSnippet,
  appUrl,
}: EscalationAlertProps) {
  const ctaUrl = `${appUrl}/dashboard/conversations?id=${conversationId}`

  return (
    <Html lang="en">
      <Head />
      <Preview>⚡ Action needed — {contactIdentifier} needs your attention on {channel}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>LYCHO</Text>
          </Section>

          <Section style={alertBanner}>
            <Text style={alertLabel}>⚡ ESCALATION ALERT</Text>
            <Heading style={alertHeading}>Your agent escalated a conversation</Heading>
            <Text style={alertSubtext}>
              {businessName} — a customer on <span style={highlight}>{channel}</span> requires human attention.
            </Text>
          </Section>

          {/* Contact + Reason */}
          <Section style={card}>
            <Row>
              <Column>
                <Text style={fieldLabel}>CONTACT</Text>
                <Text style={fieldValue}>{contactIdentifier}</Text>
              </Column>
              <Column>
                <Text style={fieldLabel}>CHANNEL</Text>
                <Text style={fieldValue}>{channel.toUpperCase()}</Text>
              </Column>
            </Row>
            <Section style={{ marginTop: '16px' }}>
              <Text style={fieldLabel}>REASON FOR ESCALATION</Text>
              <div style={reasonBox}>
                <Text style={reasonText}>{escalationReason}</Text>
              </div>
            </Section>
          </Section>

          {/* Snippet */}
          {conversationSnippet.length > 0 && (
            <Section style={snippetSection}>
              <Text style={sectionLabel}>CONVERSATION SNIPPET</Text>
              {conversationSnippet.slice(-3).map((msg, i) => (
                <div key={i} style={msg.role === 'user' ? userBubble : agentBubble}>
                  <Text style={bubbleLabel}>{msg.role === 'user' ? 'Customer' : 'Agent'}</Text>
                  <Text style={bubbleText}>{msg.content.slice(0, 200)}</Text>
                </div>
              ))}
            </Section>
          )}

          <Section style={ctaSection}>
            <Button style={ctaButton} href={ctaUrl}>
              Handle Now →
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

export default EscalationAlert

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

const alertBanner = {
  background: 'rgba(248,113,113,0.04)',
  borderBottom: '1px solid rgba(248,113,113,0.15)',
  padding: '28px 32px',
}

const alertLabel = {
  fontSize: '11px',
  letterSpacing: '0.3em',
  color: '#f87171',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
}

const alertHeading = {
  fontSize: '26px',
  color: '#F0EBE1',
  margin: '0 0 8px',
  fontWeight: 600,
}

const alertSubtext = { fontSize: '14px', color: '#6b6b6b', margin: 0 }
const highlight = { color: '#C9A84C' }

const card = { padding: '24px 32px', borderBottom: '1px solid #2a2a2a' }

const fieldLabel = {
  fontSize: '10px',
  letterSpacing: '0.3em',
  color: '#6b6b6b',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px',
}

const fieldValue = {
  fontSize: '16px',
  color: '#F0EBE1',
  fontWeight: 600,
  margin: 0,
}

const reasonBox = {
  background: 'rgba(248,113,113,0.06)',
  border: '1px solid rgba(248,113,113,0.2)',
  borderRadius: '6px',
  padding: '12px 16px',
}

const reasonText = { fontSize: '14px', color: '#F0EBE1', margin: 0, lineHeight: '1.5' }

const snippetSection = { padding: '20px 32px', borderBottom: '1px solid #2a2a2a' }

const sectionLabel = {
  fontSize: '10px',
  letterSpacing: '0.3em',
  color: '#6b6b6b',
  textTransform: 'uppercase' as const,
  margin: '0 0 12px',
}

const userBubble = {
  background: 'rgba(201,168,76,0.06)',
  border: '1px solid rgba(201,168,76,0.15)',
  borderRadius: '8px',
  padding: '10px 14px',
  marginBottom: '8px',
}

const agentBubble = {
  background: '#1c1c1c',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
  padding: '10px 14px',
  marginBottom: '8px',
}

const bubbleLabel = {
  fontSize: '10px',
  letterSpacing: '0.15em',
  color: '#6b6b6b',
  margin: '0 0 4px',
  textTransform: 'uppercase' as const,
}

const bubbleText = { fontSize: '13px', color: '#F0EBE1', margin: 0, lineHeight: '1.5' }

const ctaSection = { padding: '28px 32px', textAlign: 'center' as const }

const ctaButton = {
  backgroundColor: '#f87171',
  color: '#fff',
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
