import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('framer-motion', () => {
  const motion = new Proxy(
    {},
    {
      get: () => (props: any) => React.createElement('div', props),
    },
  )
  return {
    motion,
    AnimatePresence: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
  }
})

import NomicDocumentsMap from '../NomicDocumentsMap'

describe('NomicDocumentsMap', () => {
  it('shows loading state, then renders an iframe when data is available', async () => {
    let resolveFetch: (res: Response) => void
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve
    })

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => fetchPromise)

    const { container } = render(<NomicDocumentsMap course_name="CS101" />)
    expect(container.querySelector('.skeleton-box')).toBeTruthy()

    resolveFetch!(
      new Response(
        JSON.stringify({ map_id: 'map-1', map_link: 'https://example.com/map' }),
        { status: 200 },
      ),
    )

    await waitFor(() =>
      expect(container.querySelector('iframe')).toHaveAttribute('id', 'map-1'),
    )
    expect(container.querySelector('iframe')).toHaveAttribute(
      'src',
      'https://example.com/map',
    )
  })

  it('toggles the info accordion and shows a fallback when no map is available', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ map_id: null, map_link: null }), {
        status: 200,
      }),
    )

    render(<NomicDocumentsMap course_name="CS101" />)

    await waitFor(() =>
      expect(
        screen.getByText(/Visualization Not Available Yet/i),
      ).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByTitle(/More info on nomic map/i))
    expect(
      screen.getByText(/The Concept Map visualizes all queries/i),
    ).toBeInTheDocument()
  })
})
