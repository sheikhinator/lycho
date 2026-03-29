const TELEGRAM_API = 'https://api.telegram.org/bot'

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  botToken: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML',
): Promise<void> {
  await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    }),
  })
}

export async function setTelegramWebhook(
  botToken: string,
  webhookUrl: string,
): Promise<{ ok: boolean; description?: string }> {
  const res = await fetch(`${TELEGRAM_API}${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  })
  return res.json()
}

export async function getTelegramBotInfo(
  botToken: string,
): Promise<{ id: number; username: string; first_name: string } | null> {
  try {
    const res = await fetch(`${TELEGRAM_API}${botToken}/getMe`)
    const data = await res.json()
    if (data.ok) return data.result
    return null
  } catch {
    return null
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseTelegramUpdate(body: any) {
  const message = body.message ?? body.edited_message
  if (!message) return null

  return {
    channel: 'telegram' as const,
    contactIdentifier: String(message.chat.id),
    contactName: [message.from?.first_name, message.from?.last_name].filter(Boolean).join(' '),
    content: {
      type: 'text' as const,
      text: message.text ?? message.caption ?? '',
    },
    timestamp: new Date(message.date * 1000).toISOString(),
    externalMessageId: String(message.message_id),
    metadata: { botUsername: body.bot_info?.username },
  }
}
