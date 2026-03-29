import { Resend } from 'resend'
import { render } from '@react-email/render'
import { HotLeadAlert } from './email-templates/hot-lead-alert'
import { EscalationAlert } from './email-templates/escalation-alert'
import { DailyDigest } from './email-templates/daily-digest'
import { TrialExpiry } from './email-templates/trial-expiry'
import { WeeklyROI } from './email-templates/weekly-roi'
import React from 'react'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'LYCHO <alerts@lycho.ai>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lycho.vercel.app'

export async function sendHotLeadAlert(
  ownerEmail: string,
  businessName: string,
  contactIdentifier: string,
  leadScore: number,
  conversationId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conversationSnippet: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contactProfile: any,
  channel = 'unknown',
): Promise<void> {
  try {
    const html = await render(
      React.createElement(HotLeadAlert, {
        businessName,
        contactIdentifier,
        leadScore,
        conversationId,
        conversationSnippet,
        sentiment: contactProfile?.sentiment ?? 'neutral',
        channel,
        appUrl: APP_URL,
      }),
    )

    await resend.emails.send({
      from: FROM,
      to: ownerEmail,
      subject: `🔥 HOT LEAD — ${contactIdentifier} scored ${leadScore}/100`,
      html,
    })
  } catch (err) {
    console.error('[email-service] sendHotLeadAlert error:', err)
  }
}

export async function sendEscalationAlert(
  ownerEmail: string,
  businessName: string,
  contactIdentifier: string,
  channel: string,
  conversationId: string,
  reason: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conversationSnippet: any[] = [],
): Promise<void> {
  try {
    const html = await render(
      React.createElement(EscalationAlert, {
        businessName,
        contactIdentifier,
        channel,
        conversationId,
        escalationReason: reason,
        conversationSnippet,
        appUrl: APP_URL,
      }),
    )

    await resend.emails.send({
      from: FROM,
      to: ownerEmail,
      subject: `⚡ Action needed — ${contactIdentifier} needs your attention on ${channel}`,
      html,
    })
  } catch (err) {
    console.error('[email-service] sendEscalationAlert error:', err)
  }
}

export async function sendDailyDigest(
  ownerEmail: string,
  businessName: string,
  stats: {
    interactions: number
    hotLeads: number
    escalations: number
    topAgent: string
    topChannel: string
  },
): Promise<void> {
  try {
    const date = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

    const html = await render(
      React.createElement(DailyDigest, {
        businessName,
        date,
        stats,
        appUrl: APP_URL,
      }),
    )

    await resend.emails.send({
      from: FROM,
      to: ownerEmail,
      subject: `📊 Your LYCHO Daily Brief — ${date}`,
      html,
    })
  } catch (err) {
    console.error('[email-service] sendDailyDigest error:', err)
  }
}

export async function sendTrialExpiry(
  ownerEmail: string,
  businessName: string,
  daysRemaining: number,
): Promise<void> {
  try {
    const html = await render(
      React.createElement(TrialExpiry, {
        businessName,
        daysRemaining,
        appUrl: APP_URL,
      }),
    )

    await resend.emails.send({
      from: FROM,
      to: ownerEmail,
      subject: `Your LYCHO trial expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
      html,
    })
  } catch (err) {
    console.error('[email-service] sendTrialExpiry error:', err)
  }
}

export async function sendWeeklyROI(
  ownerEmail: string,
  businessName: string,
  totalValuePkr: number,
  stats: {
    interactions: number
    hotLeads: number
    escalations: number
    avgResponseTimeMs: number
  },
  agentPerformance: Array<{
    name: string
    interactions: number
    hotLeads: number
    revenue: number
  }>,
): Promise<void> {
  try {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)
    const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

    const html = await render(
      React.createElement(WeeklyROI, {
        businessName,
        weekLabel,
        totalValuePkr,
        stats,
        agentPerformance,
        appUrl: APP_URL,
      }),
    )

    await resend.emails.send({
      from: FROM,
      to: ownerEmail,
      subject: `💰 LYCHO delivered PKR ${totalValuePkr.toLocaleString()} in value this week`,
      html,
    })
  } catch (err) {
    console.error('[email-service] sendWeeklyROI error:', err)
  }
}
