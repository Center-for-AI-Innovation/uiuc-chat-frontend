// src/utils/crypto.ts
export const encrypt = async (text: string, key: string) => {
  if (!text || !key) {
    console.error(
      'Error encrypting because text or key is not available',
      text,
      key,
    )
    return
  }
  const pwUtf8 = new TextEncoder().encode(key)
  const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const alg = { name: 'AES-GCM', iv: iv }
  const encryptKey = await crypto.subtle.importKey('raw', pwHash, alg, false, [
    'encrypt',
  ])
  const encrypted = await crypto.subtle.encrypt(
    alg,
    encryptKey,
    new TextEncoder().encode(text),
  )
  const encryptedBase64 = Buffer.from(new Uint8Array(encrypted)).toString(
    'base64',
  )
  const ivBase64 = Buffer.from(iv).toString('base64')
  const version = 'v1'
  return `${version}.${encryptedBase64}.${ivBase64}`
}

export const decrypt = async (encryptedText: string, key: string) => {
  if (!encryptedText || !key) {
    console.error(
      'Error decrypting because encryptedText or key is not available',
      encryptedText,
      key,
    )
    return
  }
  const [version, encryptedBase64, ivBase64] = encryptedText.split('.')
  if (!version || !encryptedBase64 || !ivBase64) {
    throw new Error('Invalid encrypted text format')
  }
  if (version !== 'v1') {
    throw new Error(`Unsupported encryption version: ${version}`)
  }
  const pwUtf8 = new TextEncoder().encode(key)
  const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8)
  const iv = Buffer.from(ivBase64, 'base64')
  const alg = { name: 'AES-GCM', iv: new Uint8Array(iv) }
  const decryptKey = await crypto.subtle.importKey('raw', pwHash, alg, false, [
    'decrypt',
  ])
  try {
    const ptBuffer = await crypto.subtle.decrypt(
      alg,
      decryptKey,
      Buffer.from(encryptedBase64, 'base64'),
    )
    return new TextDecoder().decode(ptBuffer)
  } catch (error) {
    throw new Error('Failed to decrypt data: ' + (error as Error).message)
  }
}

export function isEncrypted(str: string) {
  if (!str) return false
  const parts = str.split('.')
  if (parts.length !== 3) return false
  const [version, encryptedBase64, ivBase64] = parts
  if (version !== 'v1') return false
  const base64Regex =
    /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/
  return base64Regex.test(encryptedBase64!) && base64Regex.test(ivBase64!)
}

export const decryptKeyIfNeeded = async (key: string): Promise<string> => {
  if (key && isEncrypted(key)) {
    try {
      const decryptedText = await decrypt(
        key,
        process.env.NEXT_PUBLIC_SIGNING_KEY as string,
      )
      return decryptedText as string
    } catch (error) {
      console.error('Failed to decrypt key:', error)
      throw error
    }
  }
  return key
}

export const encryptKeyIfNeeded = async (key: string) => {
  if (key && !isEncrypted(key)) {
    try {
      const encryptedText = await encrypt(
        key,
        process.env.NEXT_PUBLIC_SIGNING_KEY as string,
      )
      return encryptedText
    } catch (error) {
      console.error('Failed to encrypt key:', error)
      throw error
    }
  }
  return key
}
