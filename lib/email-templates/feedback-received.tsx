import { Resend } from 'resend'
import { render } from '@react-email/render'
import React from 'react'

const FROM = 'LYCHO <alerts@lycho.ai>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lycho.vercel.app'

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  return apiKey ? new Resend(apiKey) : null
}

export async function sendFeedbackReceived(
  ownerEmail: string,
  businessName: string,
  feedbackType: string,
  message: string,
  rating?: number,
): Promise<void> {
  try {
    const resend = getResendClient()
    if (!resend) return
    const html = await render(
      React.createElement(
        'div',
        { style: { fontFamily: 'system-ui, sans-serif', padding: '24px', backgroundColor: '#070707', color: '#F0EBE1' } },
        React.createElement('div', { style: { maxWidth: '480px', margin: '0 auto', backgroundColor: '#141414', borderRadius: '12px', padding: '24px', border: '1px solid #2a2a2a' } },
          React.createElement('p', { style: { fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#C9A84C', marginBottom: '8px' } }, 'New Feedback Received'),
          React.createElement('h1', { style: { fontSize: '24px', fontWeight: '700', marginBottom: '16px' } }, `Thank you, ${businessName}`),
          React.createElement('p', { style: { fontSize: '14px', color: '#6b6b6b', lineHeight: '1.6', marginBottom: '16px' } },
            `Your ${feedbackType} feedback has been received and will be reviewed by our team.`
          ),
          React.createElement('div', { style: { backgroundColor: '#1c1c1c', borderRadius: '8px', padding: '16px', marginBottom: '16px' } },
            React.createElement('p', { style: { fontSize: '13px', color: '#F0EBE1', marginBottom: '8px' } }, message),
            rating ? React.createElement('p', { style: { fontSize: '12px', color: '#C9A84C' } }, `Rating: ${rating}/5`) : null,
          ),
          React.createElement('a', {
            href: `${APP_URL}/dashboard`,
            style: { display: 'inline-block', backgroundColor: '#C9A84C', color: '#070707', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }
          }, 'Go to Dashboard'),
          React.createElement('p', { style: { fontSize: '12px', color: '#6b6b6b', marginTop: '16px' } },
            'We value your input and continuously improve based on feedback from our community.'
          ),
        ),
      ),
    )

    await resend.emails.send({
      from: FROM,
      to: ownerEmail,
      subject: `Feedback received — Thank you!`,
      html,
    })
  } catch {}
}
