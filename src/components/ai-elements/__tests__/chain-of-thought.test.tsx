import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchIcon } from 'lucide-react'

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtImage,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from '../chain-of-thought'

// ---------------------------------------------------------------------------
// Helper: wraps children in the required ChainOfThought provider
// ---------------------------------------------------------------------------
function renderWithChainOfThought(
  ui: React.ReactElement,
  chainProps: React.ComponentProps<typeof ChainOfThought> = {},
) {
  return render(<ChainOfThought {...chainProps}>{ui}</ChainOfThought>)
}

// ===========================================================================
// ChainOfThought (root provider + wrapper)
// ===========================================================================
describe('ChainOfThought', () => {
  it('renders children inside a wrapper div', () => {
    render(
      <ChainOfThought data-testid="cot-root">
        <p>hello</p>
      </ChainOfThought>,
    )
    expect(screen.getByTestId('cot-root')).toBeInTheDocument()
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('applies additional className', () => {
    render(
      <ChainOfThought className="custom-class" data-testid="cot-root">
        <span>x</span>
      </ChainOfThought>,
    )
    expect(screen.getByTestId('cot-root').className).toContain('custom-class')
  })

  it('spreads extra HTML attributes onto the wrapper div', () => {
    render(
      <ChainOfThought aria-label="chain" data-testid="cot-root">
        <span>x</span>
      </ChainOfThought>,
    )
    expect(screen.getByTestId('cot-root')).toHaveAttribute(
      'aria-label',
      'chain',
    )
  })

  it('defaults to collapsed (closed) state', () => {
    render(
      <ChainOfThought>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent data-testid="cot-content">
          <p>hidden</p>
        </ChainOfThoughtContent>
      </ChainOfThought>,
    )
    // Radix Collapsible removes content from the DOM when closed
    expect(screen.queryByText('hidden')).not.toBeInTheDocument()
  })

  it('respects defaultOpen=true', () => {
    render(
      <ChainOfThought defaultOpen={true}>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent>
          <p>visible</p>
        </ChainOfThoughtContent>
      </ChainOfThought>,
    )
    expect(screen.getByText('visible')).toBeVisible()
  })

  it('respects controlled open prop', () => {
    const { rerender } = render(
      <ChainOfThought open={false}>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent>
          <p>content</p>
        </ChainOfThoughtContent>
      </ChainOfThought>,
    )
    expect(screen.queryByText('content')).not.toBeInTheDocument()

    rerender(
      <ChainOfThought open={true}>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent>
          <p>content</p>
        </ChainOfThoughtContent>
      </ChainOfThought>,
    )
    expect(screen.getByText('content')).toBeVisible()
  })

  it('calls onOpenChange when toggled', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <ChainOfThought onOpenChange={onOpenChange}>
        <ChainOfThoughtHeader>Toggle</ChainOfThoughtHeader>
        <ChainOfThoughtContent>
          <p>inner</p>
        </ChainOfThoughtContent>
      </ChainOfThought>,
    )

    await user.click(screen.getByText('Toggle'))
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })
})

// ===========================================================================
// ChainOfThoughtHeader
// ===========================================================================
describe('ChainOfThoughtHeader', () => {
  it('renders default label when no children are provided', () => {
    renderWithChainOfThought(<ChainOfThoughtHeader />)
    expect(screen.getByText('Chain of Thought')).toBeInTheDocument()
  })

  it('renders custom children instead of default label', () => {
    renderWithChainOfThought(
      <ChainOfThoughtHeader>Thinking...</ChainOfThoughtHeader>,
    )
    expect(screen.getByText('Thinking...')).toBeInTheDocument()
    expect(screen.queryByText('Chain of Thought')).not.toBeInTheDocument()
  })

  it('toggles open state on click', async () => {
    const user = userEvent.setup()

    render(
      <ChainOfThought>
        <ChainOfThoughtHeader>Click me</ChainOfThoughtHeader>
        <ChainOfThoughtContent>
          <p>revealed</p>
        </ChainOfThoughtContent>
      </ChainOfThought>,
    )

    expect(screen.queryByText('revealed')).not.toBeInTheDocument()

    await user.click(screen.getByText('Click me'))
    expect(screen.getByText('revealed')).toBeVisible()

    await user.click(screen.getByText('Click me'))
    expect(screen.queryByText('revealed')).not.toBeInTheDocument()
  })

  it('applies additional className', () => {
    renderWithChainOfThought(
      <ChainOfThoughtHeader className="extra">Title</ChainOfThoughtHeader>,
    )
    const trigger = screen.getByRole('button')
    expect(trigger.className).toContain('extra')
  })

  it('throws when used outside ChainOfThought provider', () => {
    // Suppress React error boundary noise
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<ChainOfThoughtHeader />)).toThrow(
      'ChainOfThought components must be used within ChainOfThought',
    )
    spy.mockRestore()
  })
})

// ===========================================================================
// ChainOfThoughtContent
// ===========================================================================
describe('ChainOfThoughtContent', () => {
  it('shows content when open', () => {
    render(
      <ChainOfThought defaultOpen>
        <ChainOfThoughtContent>
          <p>visible stuff</p>
        </ChainOfThoughtContent>
      </ChainOfThought>,
    )
    expect(screen.getByText('visible stuff')).toBeVisible()
  })

  it('hides content when closed', () => {
    render(
      <ChainOfThought defaultOpen={false}>
        <ChainOfThoughtContent>
          <p>hidden stuff</p>
        </ChainOfThoughtContent>
      </ChainOfThought>,
    )
    expect(screen.queryByText('hidden stuff')).not.toBeInTheDocument()
  })

  it('applies additional className', () => {
    render(
      <ChainOfThought defaultOpen>
        <ChainOfThoughtContent className="my-content" data-testid="content">
          <p>text</p>
        </ChainOfThoughtContent>
      </ChainOfThought>,
    )
    // The CollapsibleContent wrapper receives the className
    const el =
      screen.getByTestId('content').querySelector('[class*="my-content"]') ??
      screen.getByTestId('content')
    expect(el.className).toContain('my-content')
  })

  it('throws when used outside ChainOfThought provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(
        <ChainOfThoughtContent>
          <p>orphan</p>
        </ChainOfThoughtContent>,
      ),
    ).toThrow('ChainOfThought components must be used within ChainOfThought')
    spy.mockRestore()
  })
})

// ===========================================================================
// ChainOfThoughtStep
// ===========================================================================
describe('ChainOfThoughtStep', () => {
  it('renders label text', () => {
    renderWithChainOfThought(<ChainOfThoughtStep label="Searching documents" />)
    expect(screen.getByText('Searching documents')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    renderWithChainOfThought(
      <ChainOfThoughtStep
        label="Step 1"
        description="Querying the vector store"
      />,
    )
    expect(screen.getByText('Querying the vector store')).toBeInTheDocument()
  })

  it('does not render description when omitted', () => {
    const { container } = renderWithChainOfThought(
      <ChainOfThoughtStep label="Step 1" />,
    )
    // Only the label div should exist, no description div
    const textDivs = container.querySelectorAll('.text-xs')
    expect(textDivs).toHaveLength(0)
  })

  it('renders children', () => {
    renderWithChainOfThought(
      <ChainOfThoughtStep label="Step">
        <span>child element</span>
      </ChainOfThoughtStep>,
    )
    expect(screen.getByText('child element')).toBeInTheDocument()
  })

  it('applies "complete" status styles by default', () => {
    const { container } = renderWithChainOfThought(
      <ChainOfThoughtStep label="Done" data-testid="step" />,
    )
    const stepDiv = screen.getByTestId('step')
    expect(stepDiv.className).toContain('text-muted-foreground')
    // Should not contain the active class pattern that doesn't include a slash
    expect(stepDiv.className).not.toContain('text-foreground ')
  })

  it('applies "active" status styles', () => {
    renderWithChainOfThought(
      <ChainOfThoughtStep label="Running" status="active" data-testid="step" />,
    )
    const stepDiv = screen.getByTestId('step')
    expect(stepDiv.className).toContain('text-foreground')
  })

  it('applies "pending" status styles', () => {
    renderWithChainOfThought(
      <ChainOfThoughtStep
        label="Waiting"
        status="pending"
        data-testid="step"
      />,
    )
    const stepDiv = screen.getByTestId('step')
    expect(stepDiv.className).toContain('text-muted-foreground/50')
  })

  it('renders a custom icon', () => {
    renderWithChainOfThought(
      <ChainOfThoughtStep
        label="Search"
        icon={SearchIcon}
        data-testid="step"
      />,
    )
    // The custom icon should be rendered (lucide icons render as SVGs)
    const stepDiv = screen.getByTestId('step')
    const svg = stepDiv.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('applies additional className', () => {
    renderWithChainOfThought(
      <ChainOfThoughtStep label="x" className="my-step" data-testid="step" />,
    )
    expect(screen.getByTestId('step').className).toContain('my-step')
  })

  it('renders a ReactNode label', () => {
    renderWithChainOfThought(
      <ChainOfThoughtStep label={<strong>Bold label</strong>} />,
    )
    expect(screen.getByText('Bold label')).toBeInTheDocument()
    expect(screen.getByText('Bold label').tagName).toBe('STRONG')
  })
})

// ===========================================================================
// ChainOfThoughtSearchResults
// ===========================================================================
describe('ChainOfThoughtSearchResults', () => {
  it('renders children', () => {
    renderWithChainOfThought(
      <ChainOfThoughtSearchResults>
        <span>result A</span>
        <span>result B</span>
      </ChainOfThoughtSearchResults>,
    )
    expect(screen.getByText('result A')).toBeInTheDocument()
    expect(screen.getByText('result B')).toBeInTheDocument()
  })

  it('applies additional className', () => {
    renderWithChainOfThought(
      <ChainOfThoughtSearchResults
        className="custom-results"
        data-testid="results"
      >
        <span>x</span>
      </ChainOfThoughtSearchResults>,
    )
    expect(screen.getByTestId('results').className).toContain('custom-results')
  })
})

// ===========================================================================
// ChainOfThoughtSearchResult
// ===========================================================================
describe('ChainOfThoughtSearchResult', () => {
  it('renders as a badge with text', () => {
    renderWithChainOfThought(
      <ChainOfThoughtSearchResult>Doc #1</ChainOfThoughtSearchResult>,
    )
    expect(screen.getByText('Doc #1')).toBeInTheDocument()
  })

  it('applies additional className', () => {
    renderWithChainOfThought(
      <ChainOfThoughtSearchResult className="my-badge" data-testid="badge">
        result
      </ChainOfThoughtSearchResult>,
    )
    expect(screen.getByTestId('badge').className).toContain('my-badge')
  })

  it('uses secondary variant by default', () => {
    renderWithChainOfThought(
      <ChainOfThoughtSearchResult data-testid="badge">
        tag
      </ChainOfThoughtSearchResult>,
    )
    // Badge with variant="secondary" gets bg-secondary class
    expect(screen.getByTestId('badge').className).toContain('bg-secondary')
  })
})

// ===========================================================================
// ChainOfThoughtImage
// ===========================================================================
describe('ChainOfThoughtImage', () => {
  it('renders children (image)', () => {
    renderWithChainOfThought(
      <ChainOfThoughtImage>
        <img src="https://example.com/img.png" alt="test image" />
      </ChainOfThoughtImage>,
    )
    expect(screen.getByAltText('test image')).toBeInTheDocument()
  })

  it('renders caption when provided', () => {
    renderWithChainOfThought(
      <ChainOfThoughtImage caption="Figure 1: Architecture diagram">
        <img src="https://example.com/img.png" alt="diagram" />
      </ChainOfThoughtImage>,
    )
    expect(
      screen.getByText('Figure 1: Architecture diagram'),
    ).toBeInTheDocument()
  })

  it('does not render caption when omitted', () => {
    const { container } = renderWithChainOfThought(
      <ChainOfThoughtImage>
        <img src="https://example.com/img.png" alt="no cap" />
      </ChainOfThoughtImage>,
    )
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs).toHaveLength(0)
  })

  it('applies additional className', () => {
    renderWithChainOfThought(
      <ChainOfThoughtImage className="img-wrapper" data-testid="img-wrap">
        <img src="https://example.com/img.png" alt="x" />
      </ChainOfThoughtImage>,
    )
    expect(screen.getByTestId('img-wrap').className).toContain('img-wrapper')
  })
})

// ===========================================================================
// displayName assignments
// ===========================================================================
describe('displayName', () => {
  it('all exported components have correct displayName', () => {
    expect(ChainOfThought.displayName).toBe('ChainOfThought')
    expect(ChainOfThoughtHeader.displayName).toBe('ChainOfThoughtHeader')
    expect(ChainOfThoughtStep.displayName).toBe('ChainOfThoughtStep')
    expect(ChainOfThoughtSearchResults.displayName).toBe(
      'ChainOfThoughtSearchResults',
    )
    expect(ChainOfThoughtSearchResult.displayName).toBe(
      'ChainOfThoughtSearchResult',
    )
    expect(ChainOfThoughtContent.displayName).toBe('ChainOfThoughtContent')
    expect(ChainOfThoughtImage.displayName).toBe('ChainOfThoughtImage')
  })
})

// ===========================================================================
// Integration: full composition
// ===========================================================================
describe('Integration: full composition', () => {
  it('renders a complete chain-of-thought with all sub-components', async () => {
    const user = userEvent.setup()

    render(
      <ChainOfThought data-testid="cot">
        <ChainOfThoughtHeader>Reasoning</ChainOfThoughtHeader>
        <ChainOfThoughtContent>
          <ChainOfThoughtStep label="Analyzing query" status="complete" />
          <ChainOfThoughtStep
            label="Searching"
            status="active"
            description="Looking through 42 documents"
          >
            <ChainOfThoughtSearchResults>
              <ChainOfThoughtSearchResult>doc-1.pdf</ChainOfThoughtSearchResult>
              <ChainOfThoughtSearchResult>doc-2.pdf</ChainOfThoughtSearchResult>
            </ChainOfThoughtSearchResults>
          </ChainOfThoughtStep>
          <ChainOfThoughtStep label="Synthesizing" status="pending" />
          <ChainOfThoughtImage caption="Generated diagram">
            <img src="/diagram.png" alt="diagram" />
          </ChainOfThoughtImage>
        </ChainOfThoughtContent>
      </ChainOfThought>,
    )

    // Initially collapsed
    expect(screen.getByText('Reasoning')).toBeInTheDocument()
    expect(screen.queryByText('Analyzing query')).not.toBeInTheDocument()

    // Expand
    await user.click(screen.getByText('Reasoning'))
    expect(screen.getByText('Analyzing query')).toBeVisible()
    expect(screen.getByText('Searching')).toBeVisible()
    expect(screen.getByText('Looking through 42 documents')).toBeVisible()
    expect(screen.getByText('doc-1.pdf')).toBeVisible()
    expect(screen.getByText('doc-2.pdf')).toBeVisible()
    expect(screen.getByText('Synthesizing')).toBeVisible()
    expect(screen.getByText('Generated diagram')).toBeVisible()
    expect(screen.getByAltText('diagram')).toBeVisible()

    // Collapse again
    await user.click(screen.getByText('Reasoning'))
    expect(screen.queryByText('Analyzing query')).not.toBeInTheDocument()
  })
})
