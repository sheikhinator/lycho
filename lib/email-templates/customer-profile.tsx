import { Html, Head, Body, Container, Section, Heading, Text, Hr, Button } from '@react-email/components'
import React from 'react'

interface CustomerProfileEmailProps {
  customerName: string
  contactIdentifier: string
  profile: Record<string, any>
  queries: string[]
  conversationId: string
  channel: string
  sentiment: string
  leadScore: number
  appUrl: string
}

export function CustomerProfileEmail({
  customerName,
  contactIdentifier,
  profile,
  queries,
  conversationId,
  channel,
  sentiment,
  leadScore,
  appUrl,
}: CustomerProfileEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f6f9fc', margin: 0, padding: 0 }}>
        <Container style={{ backgroundColor: '#ffffff', margin: '40px auto', padding: '20px', maxWidth: '600px', borderRadius: '8px' }}>
          <Section>
            <Heading style={{ color: '#333', fontSize: '24px', marginBottom: '10px' }}>
              New Customer Query via {channel}
            </Heading>
            <Text style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
              {new Date().toLocaleString()}
            </Text>
          </Section>

          <Hr style={{ borderColor: '#e6ebf1', margin: '20px 0' }} />

          <Section>
            <Heading as="h2" style={{ color: '#333', fontSize: '18px', marginBottom: '10px' }}>
              Customer Profile
            </Heading>
            <Text style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>
              <strong>Name:</strong> {customerName || 'Not provided'}
            </Text>
            <Text style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>
              <strong>Contact:</strong> {contactIdentifier}
            </Text>
            <Text style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>
              <strong>Sentiment:</strong> {sentiment || 'neutral'}
            </Text>
            <Text style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>
              <strong>Lead Score:</strong> {leadScore}/100
            </Text>

            {profile && Object.keys(profile).length > 0 && (
              <>
                <Heading as="h3" style={{ color: '#333', fontSize: '16px', marginTop: '15px', marginBottom: '10px' }}>
                  Additional Details
                </Heading>
                {Object.entries(profile).map(([key, value]) => (
                  <Text key={key} style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>
                    <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {String(value)}
                  </Text>
                ))}
              </>
            )}
          </Section>

          <Hr style={{ borderColor: '#e6ebf1', margin: '20px 0' }} />

          <Section>
            <Heading as="h2" style={{ color: '#333', fontSize: '18px', marginBottom: '10px' }}>
              Customer Queries ({queries.length})
            </Heading>
            {queries.map((query, index) => (
              <div key={index} style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
                <Text style={{ color: '#333', fontSize: '14px', margin: 0 }}>
                  {index + 1}. {query}
                </Text>
              </div>
            ))}
          </Section>

          <Hr style={{ borderColor: '#e6ebf1', margin: '20px 0' }} />

          <Section style={{ textAlign: 'center' }}>
            <Button
              href={`${appUrl}/dashboard/conversations/${conversationId}`}
              style={{ backgroundColor: '#5469d4', color: '#fff', padding: '12px 20px', borderRadius: '4px', textDecoration: 'none' }}
            >
              View Full Conversation
            </Button>
          </Section>

          <Text style={{ color: '#999', fontSize: '12px', marginTop: '30px', textAlign: 'center' }}>
            Powered by LYCHO — AI Agent Platform
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
