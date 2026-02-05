import { describe, expect, it, vi } from 'vitest'
import {
  decrypt,
  decryptKeyIfNeeded,
  encrypt,
  encryptKeyIfNeeded,
  isEncrypted,
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
