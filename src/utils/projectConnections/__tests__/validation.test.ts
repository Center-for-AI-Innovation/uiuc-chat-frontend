import { describe, expect, it } from 'vitest'
import {
  s3ConfigSchema,
  databaseConfigSchema,
  qdrantConfigSchema,
  embeddingConfigSchema,
  upsertBodySchema,
  setActiveBodySchema,
  testBodySchema,
  deleteQuerySchema,
  EMBEDDING_PROVIDERS,
} from '../validation'

describe('projectConnections/validation — S3', () => {
  it('accepts minimal required fields', () => {
    expect(
      s3ConfigSchema.safeParse({
        aws_access_key_id: 'AKIA1234',
        aws_secret_access_key: 'super-secret',
      }).success,
    ).toBe(true)
  })

  it('rejects missing credentials', () => {
    expect(
      s3ConfigSchema.safeParse({ aws_access_key_id: 'AKIA' }).success,
    ).toBe(false)
  })

  it('rejects non-URL endpoint_url', () => {
    expect(
      s3ConfigSchema.safeParse({
        aws_access_key_id: 'AKIA',
        aws_secret_access_key: 's',
        endpoint_url: 'not a url',
      }).success,
    ).toBe(false)
  })
})

describe('projectConnections/validation — database', () => {
  it('requires connection_uri', () => {
    expect(databaseConfigSchema.safeParse({}).success).toBe(false)
    expect(
      databaseConfigSchema.safeParse({
        connection_uri: 'postgres://u:p@host:5432/db',
      }).success,
    ).toBe(true)
  })
})

describe('projectConnections/validation — Qdrant', () => {
  const base = {
    url: 'https://qdrant.example.com',
    api_key: 'key',
    port: 6333,
    default_collection: 'my-coll',
  }

  it('accepts the minimum required fields', () => {
    expect(qdrantConfigSchema.safeParse(base).success).toBe(true)
  })

  it('coerces port from a numeric string', () => {
    const parsed = qdrantConfigSchema.safeParse({ ...base, port: '6333' })
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.port).toBe(6333)
  })

  it('rejects non-URL', () => {
    expect(qdrantConfigSchema.safeParse({ ...base, url: 'nope' }).success).toBe(
      false,
    )
  })

  it('rejects missing required fields', () => {
    const { port, ...rest } = base
    void port
    expect(qdrantConfigSchema.safeParse(rest).success).toBe(false)
  })

  it('accepts a collections array of entry objects', () => {
    expect(
      qdrantConfigSchema.safeParse({
        ...base,
        collections: [
          { name: 'pubmed', top_n: 5, processor: 'pubmed' },
          { name: 'patents', use_filter: false },
        ],
      }).success,
    ).toBe(true)
  })

  it('rejects collections as an array of bare strings', () => {
    expect(
      qdrantConfigSchema.safeParse({
        ...base,
        collections: ['pubmed', 'patents'],
      }).success,
    ).toBe(false)
  })

  it('requires name on each collection entry', () => {
    expect(
      qdrantConfigSchema.safeParse({
        ...base,
        collections: [{ top_n: 3 }],
      }).success,
    ).toBe(false)
  })

  it('accepts optional parallel knob', () => {
    expect(
      qdrantConfigSchema.safeParse({ ...base, parallel: false }).success,
    ).toBe(true)
  })
})

describe('projectConnections/validation — embedding', () => {
  it('requires provider and model', () => {
    expect(embeddingConfigSchema.safeParse({}).success).toBe(false)
    expect(
      embeddingConfigSchema.safeParse({ provider: 'openai' }).success,
    ).toBe(false)
    expect(
      embeddingConfigSchema.safeParse({
        provider: 'openai',
        model: 'text-embedding-3-small',
      }).success,
    ).toBe(true)
  })

  it("rejects providers outside the supported enum (typos can't slip through)", () => {
    expect(
      embeddingConfigSchema.safeParse({
        provider: 'anthropic',
        model: 'voyage-3',
      }).success,
    ).toBe(false)
  })

  it("requires base_url when provider is 'ollama' and attaches the error to base_url", () => {
    const missing = embeddingConfigSchema.safeParse({
      provider: 'ollama',
      model: 'nomic-embed-text',
    })
    expect(missing.success).toBe(false)
    if (!missing.success) {
      // The refinement targets base_url so UI forms can attach the error
      // to the correct field. If a future refactor moves the `.refine`
      // without updating its `path`, this assertion fails loudly.
      const paths = missing.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('base_url')
    }
    expect(
      embeddingConfigSchema.safeParse({
        provider: 'ollama',
        model: 'nomic-embed-text',
        base_url: 'https://ollama.example.com',
      }).success,
    ).toBe(true)
  })

  it('accepts optional api_base / api_key / query_instruction', () => {
    expect(
      embeddingConfigSchema.safeParse({
        provider: 'openai',
        model: 'text-embedding-3-small',
        api_base: 'https://api.openai.com/v1',
        api_key: 'k',
        query_instruction: 'Represent this query for searching: ',
      }).success,
    ).toBe(true)
  })

  it('rejects non-URL base_url / api_base', () => {
    expect(
      embeddingConfigSchema.safeParse({
        provider: 'openai',
        model: 'text-embedding-3-small',
        base_url: 'not a url',
      }).success,
    ).toBe(false)
  })

  it('EMBEDDING_PROVIDERS defaults to openai + ollama when env is unset', () => {
    // No process.env.ALLOWED_EMBEDDING_PROVIDERS is set in the test runner —
    // the default applies. The runtime tuple must contain both providers.
    const providers = EMBEDDING_PROVIDERS as readonly string[]
    expect(providers).toContain('openai')
    expect(providers).toContain('ollama')
  })
})

describe('projectConnections/validation — ALLOWED_EMBEDDING_PROVIDERS env override', () => {
  // The module reads `process.env.ALLOWED_EMBEDDING_PROVIDERS` at import time,
  // so we have to set the env var, reset the module registry, and dynamic-import
  // a fresh copy of the module to observe the effect.
  it('restricts the Zod enum when env is set to a subset', async () => {
    const prev = process.env.ALLOWED_EMBEDDING_PROVIDERS
    process.env.ALLOWED_EMBEDDING_PROVIDERS = 'openai'
    try {
      const { vi } = await import('vitest')
      vi.resetModules()
      const mod = await import('../validation')
      // Restricted: ollama is no longer in the enum.
      expect(
        mod.embeddingConfigSchema.safeParse({
          provider: 'ollama',
          model: 'nomic-embed-text',
          base_url: 'https://ollama.example.com',
        }).success,
      ).toBe(false)
      // openai still accepted.
      expect(
        mod.embeddingConfigSchema.safeParse({
          provider: 'openai',
          model: 'text-embedding-3-small',
        }).success,
      ).toBe(true)
    } finally {
      if (prev === undefined) delete process.env.ALLOWED_EMBEDDING_PROVIDERS
      else process.env.ALLOWED_EMBEDDING_PROVIDERS = prev
      const { vi } = await import('vitest')
      vi.resetModules()
    }
  })

  it('throws at module load if the env var parses to an empty list', async () => {
    const prev = process.env.ALLOWED_EMBEDDING_PROVIDERS
    process.env.ALLOWED_EMBEDDING_PROVIDERS = ' , , '
    try {
      const { vi } = await import('vitest')
      vi.resetModules()
      await expect(import('../validation')).rejects.toThrow(
        /ALLOWED_EMBEDDING_PROVIDERS is set but parses to an empty list/,
      )
    } finally {
      if (prev === undefined) delete process.env.ALLOWED_EMBEDDING_PROVIDERS
      else process.env.ALLOWED_EMBEDDING_PROVIDERS = prev
      const { vi } = await import('vitest')
      vi.resetModules()
    }
  })
})

describe('projectConnections/validation — bodies', () => {
  it('upsertBodySchema discriminates on kind', () => {
    expect(
      upsertBodySchema.safeParse({
        project_name: 'demo',
        kind: 's3',
        config: { aws_access_key_id: 'a', aws_secret_access_key: 's' },
      }).success,
    ).toBe(true)
    expect(
      upsertBodySchema.safeParse({
        project_name: 'demo',
        kind: 's3',
        config: { connection_uri: 'postgres://...' }, // wrong shape for s3
      }).success,
    ).toBe(false)
  })

  it('setActiveBodySchema requires boolean is_active', () => {
    expect(
      setActiveBodySchema.safeParse({ project_name: 'p', is_active: true })
        .success,
    ).toBe(true)
    expect(
      setActiveBodySchema.safeParse({ project_name: 'p', is_active: 'yes' })
        .success,
    ).toBe(false)
  })

  it('testBodySchema mirrors upsert kinds', () => {
    expect(
      testBodySchema.safeParse({
        kind: 'database',
        config: { connection_uri: 'postgres://u:p@h:5432/db' },
      }).success,
    ).toBe(true)
  })

  it('upsertBodySchema accepts kind=embedding', () => {
    expect(
      upsertBodySchema.safeParse({
        project_name: 'demo',
        kind: 'embedding',
        config: { provider: 'openai', model: 'text-embedding-3-small' },
      }).success,
    ).toBe(true)
    expect(
      upsertBodySchema.safeParse({
        project_name: 'demo',
        kind: 'embedding',
        config: { provider: 'openai' }, // missing model
      }).success,
    ).toBe(false)
  })

  it('deleteQuerySchema allows omitting kind', () => {
    expect(deleteQuerySchema.safeParse({ project_name: 'demo' }).success).toBe(
      true,
    )
    expect(
      deleteQuerySchema.safeParse({ project_name: 'demo', kind: 's3' }).success,
    ).toBe(true)
    expect(
      deleteQuerySchema.safeParse({ project_name: 'demo', kind: 'embedding' })
        .success,
    ).toBe(true)
    expect(
      deleteQuerySchema.safeParse({ project_name: 'demo', kind: 'bogus' })
        .success,
    ).toBe(false)
  })
})
