const WA_BASE = 'https://graph.facebook.com/v19.0'

export async function sendWhatsAppText(
  to: string,
  text: string,
  phoneNumberId: string,
  accessToken: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${WA_BASE}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components: any[],
  phoneNumberId: string,
  accessToken: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${WA_BASE}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function markMessageRead(
  messageId: string,
  phoneNumberId: string,
  accessToken: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${WA_BASE}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}
