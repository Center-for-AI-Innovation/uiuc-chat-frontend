import { describe, expect, it, vi } from 'vitest'
import {
  decrypt,
  decryptKeyIfNeeded,
  decryptProjectConfig,
  encrypt,
  encryptKeyIfNeeded,
  encryptProjectConfig,
  isEncrypted,
  maskConfig,
} from '../crypto'

describe('crypto utilities', () => {
  it('encrypt returns undefined and logs when text or key is missing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(encrypt('', 'k')).resolves.toBeUndefined()
    await expect(encrypt('t', '')).resolves.toBeUndefined()
  })

  it('decrypt returns undefined and logs when encryptedText or key is missing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(decrypt('', 'k')).resolves.toBeUndefined()
    await expect(decrypt('v1.a.b', '')).resolves.toBeUndefined()
  })

  it('encrypts and decrypts round-trip', async () => {
    const encrypted = await encrypt('secret', 'password')
    expect(encrypted).toMatch(/^v1\.[A-Za-z0-9+/]+=*\.[A-Za-z0-9+/]+=*$/)
    expect(isEncrypted(encrypted!)).toBe(true)

    const decrypted = await decrypt(encrypted!, 'password')
    expect(decrypted).toBe('secret')
  })

  it('rejects invalid encrypted payloads', () => {
    expect(isEncrypted('')).toBe(false)
    expect(isEncrypted('v1.only-two-parts')).toBe(false)
    expect(isEncrypted('v2.a.b')).toBe(false)
    expect(isEncrypted('v1.not-base64!!.also-not')).toBe(false)
  })

  it('throws on decrypt with wrong key', async () => {
    const encrypted = await encrypt('secret', 'password')
    await expect(decrypt(encrypted!, 'wrong')).rejects.toThrow(
      /Failed to decrypt data:/,
    )
  })

  it('throws on decrypt for invalid formats and unsupported versions', async () => {
    await expect(decrypt('v1.only-two-parts', 'k')).rejects.toThrow(
      /invalid encrypted text format/i,
    )
    await expect(decrypt('v2.a.b', 'k')).rejects.toThrow(
      /unsupported encryption version/i,
    )
  })

  it('encryptKeyIfNeeded / decryptKeyIfNeeded are inverse operations', async () => {
    vi.stubEnv('NEXT_PUBLIC_SIGNING_KEY', 'signing-key')

    const raw = 'api-key-123'
    const encrypted = await encryptKeyIfNeeded(raw)
    expect(encrypted).not.toBe(raw)
    expect(isEncrypted(encrypted as string)).toBe(true)

    const decrypted = await decryptKeyIfNeeded(encrypted as string)
    expect(decrypted).toBe(raw)
  })

  it('decryptKeyIfNeeded returns key unchanged when not encrypted', async () => {
    await expect(decryptKeyIfNeeded('raw')).resolves.toBe('raw')
  })

  it('decryptKeyIfNeeded logs and rethrows when decryption fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubEnv('NEXT_PUBLIC_SIGNING_KEY', 'key2')
    const encrypted = await encrypt('raw', 'key1')
    await expect(
      decryptKeyIfNeeded(encrypted as string),
    ).rejects.toBeInstanceOf(Error)
  })

  it('encryptKeyIfNeeded returns key unchanged when already encrypted', async () => {
    const encrypted = await encrypt('raw', 'password')
    await expect(encryptKeyIfNeeded(encrypted as string)).resolves.toBe(
      encrypted,
    )
  })

  it('encryptKeyIfNeeded logs and rethrows when encryption fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubEnv('NEXT_PUBLIC_SIGNING_KEY', 'signing-key')

    const encryptSpy = vi
      .spyOn(globalThis.crypto.subtle, 'encrypt')
      .mockRejectedValueOnce(new Error('boom'))

    await expect(encryptKeyIfNeeded('raw')).rejects.toThrow(/boom/i)
    encryptSpy.mockRestore()
  })
})

describe('decryptProjectConfig', () => {
  const MASTER = 'test-master-key-do-not-use-in-prod'

  it('returns null for null/undefined and missing-encrypted field', async () => {
    vi.stubEnv('ENCRYPTION_MASTER_KEY', MASTER)
    expect(await decryptProjectConfig(null)).toBeNull()
    expect(await decryptProjectConfig(undefined)).toBeNull()
    expect(await decryptProjectConfig({ encrypted: '' } as any)).toBeNull()
  })

  it('decrypts and JSON-parses an EncryptedField', async () => {
    vi.stubEnv('ENCRYPTION_MASTER_KEY', MASTER)
    const config = {
      url: 'https://qdrant.example.com',
      api_key: 'qdrant-secret',
      port: 6333,
      default_collection: 'my-coll',
    }
    const ct = (await encrypt(JSON.stringify(config), MASTER)) as string
    const result = await decryptProjectConfig({ encrypted: ct })
    expect(result).toEqual(config)
  })

  it('throws when ENCRYPTION_MASTER_KEY is unset', async () => {
    vi.stubEnv('ENCRYPTION_MASTER_KEY', '')
    await expect(
      decryptProjectConfig({ encrypted: 'v1.x.y' } as any),
    ).rejects.toThrow(/ENCRYPTION_MASTER_KEY/)
  })

  it('throws when the decrypted plaintext is not valid JSON', async () => {
    vi.stubEnv('ENCRYPTION_MASTER_KEY', MASTER)
    const ct = (await encrypt('not json', MASTER)) as string
    await expect(decryptProjectConfig({ encrypted: ct })).rejects.toThrow(
      /JSON-parse/,
    )
  })
})

describe('encryptProjectConfig', () => {
  const MASTER = 'test-master-key-do-not-use-in-prod'

  it('round-trips through decryptProjectConfig', async () => {
    vi.stubEnv('ENCRYPTION_MASTER_KEY', MASTER)
    const config = {
      aws_access_key_id: 'AKIAEXAMPLE',
      aws_secret_access_key: 'super-secret',
      bucket_name: 'my-bucket',
      region: 'us-east-2',
    }
    const blob = await encryptProjectConfig(config)
    expect(blob.encrypted).toMatch(/^v1\..+\..+$/)
    const back = await decryptProjectConfig(blob)
    expect(back).toEqual(config)
  })

  it('throws when ENCRYPTION_MASTER_KEY is unset', async () => {
    vi.stubEnv('ENCRYPTION_MASTER_KEY', '')
    await expect(encryptProjectConfig({ a: 1 })).rejects.toThrow(
      /ENCRYPTION_MASTER_KEY/,
    )
  })
})

describe('maskConfig', () => {
  it('masks secret-bearing fields and leaves identifiers untouched', () => {
    const masked = maskConfig({
      aws_access_key_id: 'AKIAEXAMPLE1234',
      aws_secret_access_key: 'super-long-secret-ending-in-CAFE',
      bucket_name: 'cropwizard-prod',
      endpoint_url: 'https://s3.example.com',
      region: 'us-east-2',
    })
    expect(masked.aws_access_key_id).toBe('****1234')
    expect(masked.aws_secret_access_key).toBe('****CAFE')
    expect(masked.bucket_name).toBe('cropwizard-prod')
    expect(masked.endpoint_url).toBe('https://s3.example.com')
    expect(masked.region).toBe('us-east-2')
  })

  it('returns null/undefined unchanged', () => {
    expect(maskConfig(null)).toBeNull()
    expect(maskConfig(undefined)).toBeUndefined()
  })

  it('masks short secrets to ****', () => {
    const masked = maskConfig({ api_key: 'ab' })
    expect(masked.api_key).toBe('****')
  })

  it('treats connection_uri as a secret', () => {
    const masked = maskConfig({
      connection_uri: 'postgres://user:pw@host:5432/db',
    })
    expect(masked.connection_uri).toMatch(/^\*\*\*\*/)
  })
})
