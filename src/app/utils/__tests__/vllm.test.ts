/* @vitest-environment node */

import { describe, expect, it } from 'vitest'
import { buildVLLMResponseContent, normalizeVLLMStreamResponse } from '../vllm'

describe('vllm reasoning normalization', () => {
  it('combines reasoning and content into the UI think-tag format', () => {
    expect(
      buildVLLMResponseContent({
        content: '\n\nHello!',
        reasoning: 'Thinking Process:\n\n1. Analyze',
      }),
    ).toBe('<think>Thinking Process:\n\n1. Analyze</think>\n\nHello!')
  })

  it('leaves direct-answer streaming content unchanged', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"choices":[{"delta":{"content":"4"},"finish_reason":null}]}\n\n',
          ),
        )
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    const response = normalizeVLLMStreamResponse(new Response(stream))

    await expect(response.text()).resolves.toBe('4')
  })

  it('streams reasoning deltas as an opening think block followed by content', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"choices":[{"delta":{"reasoning":"Thinking"},"finish_reason":null}]}\n\n',
          ),
        )
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"choices":[{"delta":{"reasoning":" Process"},"finish_reason":null}]}\n\n',
          ),
        )
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"choices":[{"delta":{"content":"\\n\\nHello!"},"finish_reason":null}]}\n\n',
          ),
        )
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    const response = normalizeVLLMStreamResponse(new Response(stream))

    await expect(response.text()).resolves.toBe(
      '<think>Thinking Process</think>\n\nHello!',
    )
  })
})
