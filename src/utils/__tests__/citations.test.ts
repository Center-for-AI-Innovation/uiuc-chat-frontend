import { describe, expect, it, vi } from 'vitest'

vi.mock('@/hooks/__internal__/downloadPresignedUrl', () => ({
  fetchPresignedUrl: vi.fn(),
}))

import { replaceCitationLinks } from '../citations'
import { makeContextWithMetadata, makeMessage } from '~/test-utils/mocks/chat'
import { fetchPresignedUrl } from '@/hooks/__internal__/downloadPresignedUrl'

describe('replaceCitationLinks', () => {
  it('sanitizes content when no contexts are available', async () => {
    const msg = makeMessage()
    const out = await replaceCitationLinks(
      '<script>alert(1)</script>',
      msg,
      new Map(),
      'TEST101',
    )
    expect(out).toContain('&lt;script&gt;')
    expect(out).toContain('&lt;/script&gt;')
  })

  it('returns early (sanitized) when no citation patterns exist', async () => {
    const msg = makeMessage({ contexts: [makeContextWithMetadata()] })
    const out = await replaceCitationLinks(
      'Hello <b>world</b>',
      msg,
      new Map(),
      'TEST101',
    )
    expect(out).toContain('Hello')
    expect(out).toContain('&lt;b&gt;world&lt;/b&gt;')
  })

  it('replaces a single <cite> index with a markdown link', async () => {
    const context = makeContextWithMetadata({
      readable_filename: 'Document.pdf',
      url: 'https://example.com/doc.pdf',
      s3_path: '',
    })
    const msg = makeMessage({ contexts: [context] })

    const out = await replaceCitationLinks(
      'See <cite>1</cite> for details.',
      msg,
      new Map(),
      'TEST101',
    )

    expect(out).toContain(
      '[Document.pdf, p.1](https://example.com/doc.pdf#page=1 "Citation 1")',
    )
  })

  it('uses cite-tag page numbers when context has no pagenumber', async () => {
    const context = makeContextWithMetadata({
      readable_filename: 'Document.pdf',
      url: 'https://example.com/doc.pdf',
      s3_path: '',
      pagenumber: undefined as any,
    })
    const msg = makeMessage({ contexts: [context] })

    const out = await replaceCitationLinks(
      'See <cite>1, p. 12</cite>.',
      msg,
      new Map(),
      'TEST101',
    )

    expect(out).toContain(
      '[Document.pdf, p.12](https://example.com/doc.pdf#page=12 "Citation 1")',
    )
  })

  it('omits page numbers when none are available', async () => {
    const context = makeContextWithMetadata({
      readable_filename: 'Document.pdf',
      url: 'https://example.com/doc.pdf',
      s3_path: '',
      pagenumber: undefined as any,
    })
    const msg = makeMessage({ contexts: [context] })

    const out = await replaceCitationLinks(
      'See <cite>1</cite>.',
      msg,
      new Map(),
      'TEST101',
    )

    expect(out).toContain(
      '[Document.pdf](https://example.com/doc.pdf "Citation 1")',
    )
    expect(out).not.toContain('#page=')
    expect(out).not.toContain('p.')
  })

  it('supports multiple citations in a single <cite> tag', async () => {
    const msg = makeMessage({
      contexts: [
        makeContextWithMetadata({
          readable_filename: 'A.pdf',
          url: 'https://example.com/a.pdf',
          s3_path: '',
        }),
        makeContextWithMetadata({
          readable_filename: 'B.pdf',
          url: 'https://example.com/b.pdf',
          s3_path: '',
          id: 2,
        }),
      ],
    })

    const out = await replaceCitationLinks(
      'See <cite>1, 2</cite>.',
      msg,
      new Map(),
      'TEST101',
    )

    expect(out).toContain(
      '[A.pdf, p.1](https://example.com/a.pdf#page=1 "Citation 1");',
    )
    expect(out).toContain(
      '[B.pdf, p.1](https://example.com/b.pdf#page=1 "Citation 2")',
    )
  })

  it('supports multiple citations without page numbers', async () => {
    const msg = makeMessage({
      contexts: [
        makeContextWithMetadata({
          readable_filename: 'A.pdf',
          url: 'https://example.com/a.pdf',
          s3_path: '',
          pagenumber: undefined as any,
        }),
        makeContextWithMetadata({
          readable_filename: 'B.pdf',
          url: 'https://example.com/b.pdf',
          s3_path: '',
          pagenumber: undefined as any,
          id: 2,
        }),
      ],
    })

    const out = await replaceCitationLinks(
      'See <cite>1, 2</cite>.',
      msg,
      new Map(),
      'TEST101',
    )

    expect(out).toContain('[A.pdf](https://example.com/a.pdf "Citation 1");')
    expect(out).toContain('[B.pdf](https://example.com/b.pdf "Citation 2")')
    expect(out).not.toContain('p.')
  })

  it('replaces multiple <cite> tags in the same content', async () => {
    const msg = makeMessage({
      contexts: [
        makeContextWithMetadata({
          readable_filename: 'A.pdf',
          url: 'https://example.com/a.pdf',
          s3_path: '',
        }),
        makeContextWithMetadata({
          readable_filename: 'B.pdf',
          url: 'https://example.com/b.pdf',
          s3_path: '',
          id: 2,
        }),
      ],
    })

    const out = await replaceCitationLinks(
      'See <cite>1</cite> and <cite>2</cite>.',
      msg,
      new Map(),
      'TEST101',
    )

    expect(out).toContain(
      '[A.pdf, p.1](https://example.com/a.pdf#page=1 "Citation 1")',
    )
    expect(out).toContain(
      '[B.pdf, p.1](https://example.com/b.pdf#page=1 "Citation 2")',
    )
    expect(out).not.toContain('&lt;cite&gt;2&lt;/cite&gt;')
  })

  it('does not create links for unsafe URLs', async () => {
    const msg = makeMessage({
      contexts: [
        makeContextWithMetadata({
          readable_filename: 'Evil',
          url: 'javascript:alert(1)',
          s3_path: '',
        }),
      ],
    })

    const out = await replaceCitationLinks(
      'See <cite>1</cite>.',
      msg,
      new Map(),
      'TEST101',
    )

    expect(out).toContain('Evil')
    expect(out).not.toContain('](')
  })

  it('does not create links for invalid URLs (parse errors / unsafe patterns)', async () => {
    const msg = makeMessage({
      contexts: [
        makeContextWithMetadata({
          readable_filename: 'Bad1',
          url: 'not-a-url',
          s3_path: '',
          id: 1,
        }),
        makeContextWithMetadata({
          readable_filename: 'Bad2',
          url: 'https://example.com/has space',
          s3_path: '',
          id: 2,
        }),
      ],
    })

    const out = await replaceCitationLinks(
      'See <cite>1, 2</cite>.',
      msg,
      new Map(),
      'TEST101',
    )

    expect(out).toContain('Bad1')
    expect(out).toContain('Bad2')
    expect(out).not.toContain('](')
  })

  it('handles filename-style citations like "1. [Name](#)"', async () => {
    const msg = makeMessage({
      contexts: [
        makeContextWithMetadata({
          readable_filename: 'Doc 1',
          url: 'https://example.com/1.pdf',
          s3_path: '',
        }),
      ],
    })

    const out = await replaceCitationLinks(
      '1. [Doc 1](#)',
      msg,
      new Map(),
      'TEST101',
    )

    expect(out).toContain(
      '1. ([Doc 1, p.1](https://example.com/1.pdf#page=1 "Citation 1"))',
    )
  })

  it('extracts page numbers from filename-style citations when context has no pagenumber', async () => {
    const msg = makeMessage({
      contexts: [
        makeContextWithMetadata({
          readable_filename: 'Doc 1',
          url: 'https://example.com/1.pdf',
          s3_path: '',
          pagenumber: undefined as any,
        }),
      ],
    })

    const out = await replaceCitationLinks(
      '1. [Doc 1 page: 7](#)',
      msg,
      new Map(),
      'TEST101',
    )

    expect(out).toContain(
      '1. ([Doc 1, p.7](https://example.com/1.pdf#page=7 "Citation 1"))',
    )
  })

  it('handles filename-style citations without any page number', async () => {
    const msg = makeMessage({
      contexts: [
        makeContextWithMetadata({
          readable_filename: 'Doc 1',
          url: 'https://example.com/1.pdf',
          s3_path: '',
          pagenumber: undefined as any,
        }),
      ],
    })

    const out = await replaceCitationLinks(
      '1. [Doc 1](#)',
      msg,
      new Map(),
      'TEST101',
    )

    expect(out).toContain(
      '1. ([Doc 1](https://example.com/1.pdf "Citation 1"))',
    )
    expect(out).not.toContain('#page=')
    expect(out).not.toContain('p.')
  })

  it('falls back to plain text for filename-style citations when URL is invalid', async () => {
    const msg = makeMessage({
      contexts: [
        makeContextWithMetadata({
          readable_filename: 'Doc 1',
          url: 'javascript:alert(1)',
          s3_path: '',
          pagenumber: undefined as any,
        }),
      ],
    })

    const out = await replaceCitationLinks(
      '1. [Doc 1](#)',
      msg,
      new Map(),
      'TEST101',
    )

    expect(out).toContain('1. (Doc 1)')
    expect(out).not.toContain('](')
  })

  it('handles multiple filename-style citations in the same content', async () => {
    const msg = makeMessage({
      contexts: [
        makeContextWithMetadata({
          readable_filename: 'Doc 1',
          url: 'https://example.com/1.pdf',
          s3_path: '',
        }),
        makeContextWithMetadata({
          readable_filename: 'Doc 2',
          url: 'https://example.com/2.pdf',
          s3_path: '',
          id: 2,
        }),
      ],
    })

    const out = await replaceCitationLinks(
      '1. [Doc 1](#) and 2. [Doc 2](#)',
      msg,
      new Map(),
      'TEST101',
    )

    expect(out).toContain(
      '1. ([Doc 1, p.1](https://example.com/1.pdf#page=1 "Citation 1"))',
    )
    expect(out).toContain(
      '2. ([Doc 2, p.1](https://example.com/2.pdf#page=1 "Citation 2"))',
    )
    expect(out).not.toContain('2. [Doc 2](#)2.')
  })

  it('supports s3_path-based links and caches generated links', async () => {
    ;(fetchPresignedUrl as any).mockResolvedValueOnce(
      'https://signed.example/doc.pdf',
    )
    const msg = makeMessage({
      contexts: [
        makeContextWithMetadata({
          readable_filename: 'FromS3',
          url: '',
          s3_path: 's3://bucket/key',
          pagenumber: undefined as any,
        }),
      ],
    })

    const cache = new Map<number, string>()
    const out1 = await replaceCitationLinks(
      'See <cite>1</cite>.',
      msg,
      cache,
      'TEST101',
    )
    const out2 = await replaceCitationLinks(
      'See <cite>1</cite>.',
      msg,
      cache,
      'TEST101',
    )

    expect(out1).toContain(
      '[FromS3](https://signed.example/doc.pdf "Citation 1")',
    )
    expect(out2).toContain(
      '[FromS3](https://signed.example/doc.pdf "Citation 1")',
    )
    expect(fetchPresignedUrl).toHaveBeenCalledTimes(1)
  })

  it('falls back to plain text when no url or s3_path are available', async () => {
    const msg = makeMessage({
      contexts: [
        makeContextWithMetadata({
          readable_filename: 'NoLink',
          url: '',
          s3_path: '',
          pagenumber: undefined as any,
        }),
      ],
    })

    const out = await replaceCitationLinks(
      'See <cite>1</cite>.',
      msg,
      new Map(),
      'TEST101',
    )

    expect(out).toContain('NoLink')
    expect(out).not.toContain('](')
  })
})
