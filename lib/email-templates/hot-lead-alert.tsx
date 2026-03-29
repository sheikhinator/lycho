import {
  Html, Head, Body, Container, Section, Row, Column,
  Heading, Text, Button, Hr, Preview, Img,
} from '@react-email/components'

interface HotLeadAlertProps {
  businessName: string
  contactIdentifier: string
  leadScore: number
  conversationId: string
  conversationSnippet: Array<{ role: string; content: string }>
  sentiment: string
  channel: string
  appUrl: string
}

export function HotLeadAlert({
  businessName,
  contactIdentifier,
  leadScore,
  conversationId,
  conversationSnippet,
  sentiment,
  channel,
  appUrl,
}: HotLeadAlertProps) {
  const scoreBarWidth = `${leadScore}%`
  const ctaUrl = `${appUrl}/dashboard/conversations?id=${conversationId}`

  return (
    <Html lang="en">
      <Head />
      <Preview>{`🔥 HOT LEAD — ${contactIdentifier} scored ${leadScore}/100`}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Text style={logoText}>LYCHO</Text>
          </Section>

          {/* Alert Banner */}
          <Section style={alertBanner}>
            <Text style={alertLabel}>🔥 HOT LEAD DETECTED</Text>
            <Heading style={alertHeading}>A hot lead just came in</Heading>
            <Text style={alertSubtext}>
              {businessName} — a high-intent prospect is ready to convert.
            </Text>
          </Section>

          {/* Contact Profile Card */}
          <Section style={card}>
            <Row>
              <Column style={{ width: '60px' }}>
                <div style={avatarBox}>
                  {contactIdentifier.charAt(0).toUpperCase()}
                </div>
              </Column>
              <Column>
                <Text style={contactName}>{contactIdentifier}</Text>
                <Text style={contactMeta}>
                  Channel: <span style={highlight}>{channel}</span>
                  &nbsp;·&nbsp;
                  Sentiment: <span style={highlight}>{sentiment}</span>
                </Text>
              </Column>
              <Column style={{ textAlign: 'right' as const }}>
                <Text style={scoreLabel}>Lead Score</Text>
                <Text style={scoreNumber}>{leadScore}/100</Text>
              </Column>
            </Row>

            {/* Score Bar */}
            <Section style={{ marginTop: '12px' }}>
              <div style={scoreBarBg}>
                <div style={{ ...scoreBarFill, width: scoreBarWidth }} />
              </div>
            </Section>
          </Section>

          {/* Conversation Snippet */}
          {conversationSnippet.length > 0 && (
            <Section style={snippetSection}>
              <Text style={sectionLabel}>LAST 3 MESSAGES</Text>
              {conversationSnippet.slice(-3).map((msg, i) => (
                <div key={i} style={msg.role === 'user' ? userBubble : agentBubble}>
                  <Text style={bubbleLabel}>{msg.role === 'user' ? 'Customer' : 'Agent'}</Text>
                  <Text style={bubbleText}>{msg.content.slice(0, 200)}</Text>
                </div>
              ))}
            </Section>
          )}

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={ctaUrl}>
              View Conversation →
            </Button>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section>
            <Text style={footer}>
              Powered by <span style={highlight}>LYCHO</span> — Intelligence. Transmitted.
            </Text>
            <Text style={footerSub}>
              You are receiving this because you have hot lead alerts enabled.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default HotLeadAlert

// ─── Styles ───────────────────────────────────────────────────────────────────

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

const logoSection = {
  padding: '24px 32px 16px',
  borderBottom: '1px solid #2a2a2a',
}

const logoText = {
  fontFamily: '"Bebas Neue", Impact, sans-serif',
  fontSize: '28px',
  letterSpacing: '0.2em',
  color: '#C9A84C',
  margin: 0,
}

const alertBanner = {
  background: 'rgba(201,168,76,0.05)',
  borderBottom: '1px solid rgba(201,168,76,0.15)',
  padding: '28px 32px',
}

const alertLabel = {
  fontSize: '11px',
  letterSpacing: '0.3em',
  color: '#7a6130',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
}

const alertHeading = {
  fontSize: '28px',
  color: '#F0EBE1',
  margin: '0 0 8px',
  fontWeight: 600,
}

const alertSubtext = {
  fontSize: '14px',
  color: '#6b6b6b',
  margin: 0,
}

const card = {
  padding: '24px 32px',
  borderBottom: '1px solid #2a2a2a',
}

const avatarBox = {
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  background: 'rgba(201,168,76,0.1)',
  border: '2px solid rgba(201,168,76,0.3)',
  color: '#C9A84C',
  fontSize: '20px',
  fontWeight: 700,
  display: 'flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
}

const contactName = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#F0EBE1',
  margin: '0 0 4px',
}

const contactMeta = {
  fontSize: '12px',
  color: '#6b6b6b',
  margin: 0,
}

const highlight = { color: '#C9A84C' }

const scoreLabel = {
  fontSize: '10px',
  letterSpacing: '0.2em',
  color: '#6b6b6b',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px',
}

const scoreNumber = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#C9A84C',
  margin: 0,
}

const scoreBarBg = {
  height: '6px',
  borderRadius: '3px',
  background: '#2a2a2a',
  overflow: 'hidden' as const,
}

const scoreBarFill = {
  height: '6px',
  borderRadius: '3px',
  background: 'linear-gradient(90deg, #C9A84C, #f0c060)',
}

const snippetSection = {
  padding: '20px 32px',
  borderBottom: '1px solid #2a2a2a',
}

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

const bubbleText = {
  fontSize: '13px',
  color: '#F0EBE1',
  margin: 0,
  lineHeight: '1.5',
}

const ctaSection = {
  padding: '28px 32px',
  textAlign: 'center' as const,
}

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
  margin: '16px 32px 4px',
}

const footerSub = {
  fontSize: '11px',
  color: '#3a3a3a',
  textAlign: 'center' as const,
  margin: '0 32px 24px',
}
