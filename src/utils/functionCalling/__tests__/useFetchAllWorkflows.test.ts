import { describe, expect, it, vi } from 'vitest'

const { useQueryMock } = vi.hoisted(() => ({
  useQueryMock: vi.fn((options: any) => options),
}))

vi.mock('@tanstack/react-query', () => ({ useQuery: useQueryMock }))

describe('useFetchAllWorkflows', () => {
  it('wires queryKey + queryFn to fetchTools', async () => {
    const { useFetchAllWorkflows } = await import('../handleFunctionCalling')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          [
            {
              id: 'w1',
              name: 'My Workflow',
              active: true,
              updatedAt: 'u',
              createdAt: 'c',
              nodes: [
                {
                  type: 'n8n-nodes-base.formTrigger',
                  parameters: { formDescription: 'd', formFields: { values: [] } },
                },
              ],
            },
          ],
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const query = useFetchAllWorkflows('proj', 'k', 5, 'true', false) as any
    expect(query.queryKey).toEqual(['tools', 'k'])

    const data = await query.queryFn()
    expect(data).toHaveLength(1)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('limit=5'),
    )
  })
})
