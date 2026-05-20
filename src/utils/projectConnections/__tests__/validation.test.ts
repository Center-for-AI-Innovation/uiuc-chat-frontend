import { describe, expect, it } from 'vitest'
import {
  s3ConfigSchema,
  databaseConfigSchema,
  qdrantConfigSchema,
  upsertBodySchema,
  setActiveBodySchema,
  testBodySchema,
  deleteQuerySchema,
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
      qdrantConfigSchema.safeParse({ ...base, collections: ['pubmed', 'patents'] })
        .success,
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

  it('deleteQuerySchema allows omitting kind', () => {
    expect(
      deleteQuerySchema.safeParse({ project_name: 'demo' }).success,
    ).toBe(true)
    expect(
      deleteQuerySchema.safeParse({ project_name: 'demo', kind: 's3' }).success,
    ).toBe(true)
    expect(
      deleteQuerySchema.safeParse({ project_name: 'demo', kind: 'bogus' })
        .success,
    ).toBe(false)
  })
})
