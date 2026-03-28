export function extractProfileFromMetadata(response: string): {
  cleanResponse: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any
  escalated: boolean
} {
  const metadataMatch = response.match(/\[METADATA\]([\s\S]*?)\[\/METADATA\]/)

  if (!metadataMatch) {
    return {
      cleanResponse: response.replace('[ESCALATE]', '').trim(),
      metadata: null,
      escalated: response.startsWith('[ESCALATE]'),
    }
  }

  try {
    const metadata = JSON.parse(metadataMatch[1])
    const cleanResponse = response
      .replace(/\[METADATA\][\s\S]*?\[\/METADATA\]/, '')
      .replace('[ESCALATE]', '')
      .trim()

    return {
      cleanResponse,
      metadata,
      escalated: metadata.escalate || response.startsWith('[ESCALATE]'),
    }
  } catch {
    return {
      cleanResponse: response.replace('[ESCALATE]', '').trim(),
      metadata: null,
      escalated: response.startsWith('[ESCALATE]'),
    }
  }
}
