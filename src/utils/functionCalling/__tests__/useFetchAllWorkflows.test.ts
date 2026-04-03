import { describe, expect, it, vi } from 'vitest'

const { useQueryMock } = vi.hoisted(() => ({
  useQueryMock: vi.fn((options: any) => options),
}))

vi.mock('@tanstack/react-query', () => ({ useQuery: useQueryMock }))

vi.mock('posthog-js', () => ({
  default: { capture: vi.fn() },
}))

describe('useFetchAllWorkflows', () => {
  it('wires queryKey + queryFn to fetchSimTools', async () => {
    const { useFetchAllWorkflows } = await import('../handleFunctionCalling')

    // Simulate localStorage credentials so fetchSimTools makes a fetch call
    localStorage.setItem('sim_api_key_proj', 'sk-sim-test')
    localStorage.setItem('sim_workspace_id_proj', 'ws-123')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          workflows: [
            {
              id: 'w1',
              name: 'My Workflow',
              description: 'desc',
              inputFields: [],
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const query = useFetchAllWorkflows('proj') as any
    expect(query.queryKey).toEqual(['tools', 'proj'])

    const data = await query.queryFn()
    expect(data).toHaveLength(1)
    expect(data[0].name).toBe('sim_my_workflow')

    localStorage.clear()
  })

  it('throws when course_name is not provided', async () => {
    const { useFetchAllWorkflows } = await import('../handleFunctionCalling')
    expect(() => useFetchAllWorkflows()).toThrow(/course_name is required/i)
  })

  it('queryFn returns [] when fetchSimTools fails', async () => {
    const { useFetchAllWorkflows } = await import('../handleFunctionCalling')

    localStorage.setItem('sim_api_key_proj', 'sk-sim-test')
    localStorage.setItem('sim_workspace_id_proj', 'ws-123')

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network'))

    const query = useFetchAllWorkflows('proj') as any
    const data = await query.queryFn()
    expect(data).toEqual([])

    localStorage.clear()
  })
})
