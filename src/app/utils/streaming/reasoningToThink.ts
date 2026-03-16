import {
  createParser,
  type ParsedEvent,
  type ReconnectInterval,
} from 'eventsource-parser'

export function uiMessageStreamResponseToTextWithThink(
  uiResponse: Response,
): Response {
  const responseHeaders = new Headers(uiResponse.headers)
  responseHeaders.set('Content-Type', 'text/plain; charset=utf-8')

  return new Response(
    new ReadableStream({
      async start(controller) {
        const reader = uiResponse.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        const textDecoder = new TextDecoder()
        const textEncoder = new TextEncoder()

        let isThinkingOpen = false
        let sawReasoningDelta = false

        const flush = (text: string) => {
          if (!text) return
          controller.enqueue(textEncoder.encode(text))
        }

        const onParse = (event: ParsedEvent | ReconnectInterval) => {
          if (event.type !== 'event') return
          if (!event.data) return

          let payload: unknown = null
          try {
            payload = JSON.parse(event.data)
          } catch {
            return
          }

          const obj = payload as Record<string, unknown> | null
          const type = (obj?.type as string | undefined) ?? undefined

          const closeThinkIfOpen = () => {
            if (isThinkingOpen) {
              flush('</think>')
              isThinkingOpen = false
            }
          }

          switch (type) {
            case 'reasoning-start':
              break
            case 'reasoning-delta': {
              if (!isThinkingOpen) {
                flush('<think>')
                isThinkingOpen = true
              }
              const delta = (obj?.delta as string | undefined) ?? ''
              if (delta.length > 0) {
                sawReasoningDelta = true
                flush(delta)
              }
              break
            }
            case 'reasoning-end': {
              if (sawReasoningDelta) closeThinkIfOpen()
              else isThinkingOpen = false
              break
            }
            case 'text-start': {
              if (sawReasoningDelta) closeThinkIfOpen()
              break
            }
            case 'text-delta': {
              if (sawReasoningDelta) closeThinkIfOpen()
              flush((obj?.delta as string | undefined) ?? '')
              break
            }
            case 'text-end':
              break
            case 'error': {
              if (sawReasoningDelta) closeThinkIfOpen()
              flush(
                obj?.errorText
                  ? `\n${String(obj.errorText)}\n`
                  : '\nAn error occurred.\n',
              )
              break
            }
            default:
              break
          }
        }

        const parser = createParser(onParse)

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              if (isThinkingOpen && sawReasoningDelta) {
                flush('</think>')
                isThinkingOpen = false
              }
              controller.close()
              break
            }

            parser.feed(textDecoder.decode(value))
          }
        } catch (error) {
          controller.error(error)
        }
      },
    }),
    {
      headers: responseHeaders,
      status: uiResponse.status,
      statusText: uiResponse.statusText,
    },
  )
}
