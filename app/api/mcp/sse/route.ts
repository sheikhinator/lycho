export const dynamic = 'force-dynamic'

export async function GET() {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(
        `data: ${JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized',
          params: { serverInfo: { name: 'lycho', version: '1.0.0' } },
        })}\n\n`
      ))
      controller.close()
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
