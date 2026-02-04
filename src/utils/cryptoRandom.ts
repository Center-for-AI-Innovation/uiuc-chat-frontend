/**
 * Cryptographically secure random utilities
 * Replaces insecure Math.random() usage for security-sensitive operations
 */

/**
 * Generate a cryptographically secure random string of specified length
 * @param length - Length of the random string to generate
 * @param charset - Optional custom character set (defaults to alphanumeric excluding confusing characters)
 * @param lowercase - Whether to return lowercase string
 * @returns Secure random string
 */
export const generateSecureRandomString = (
  length: number,
  charset?: string,
  lowercase = false,
): string => {
  const safeLength = Math.floor(length)
  if (safeLength <= 0) return ''

  const defaultCharset = 'ABCDEFGHJKLMNPQRSTUVWXY3456789' // excluding similar looking characters like Z, 2, I, 1, O, 0
  const chars = charset && charset.length > 0 ? charset : defaultCharset
  let result = ''

  // Use cryptographically secure random values
  const randomBytes = new Uint8Array(safeLength)
  crypto.getRandomValues(randomBytes)

  for (let i = 0; i < safeLength; i++) {
    const charIndex = randomBytes[i] % chars.length
    result += chars.charAt(charIndex) || 'A'
  }

  return lowercase ? result.toLowerCase() : result
}

/**
 * Generate a cryptographically secure anonymous user ID
 * @returns Secure anonymous user ID in format: anon_[random_string]_[timestamp]
 */
export const generateAnonymousUserId = (): string => {
  const randomString = generateSecureRandomString(9)
  return `anon_${randomString}_${Date.now()}`
}

/**
 * Generate a cryptographically secure UUID for React keys
 * @returns Secure UUID string
 */
export const generateSecureKey = (): string => {
  return crypto.randomUUID()
}

/**
 * Generate a cryptographically secure random string using base36 encoding
 * Similar to Math.random().toString(36) but secure
 * @param length - Length of the random string to generate
 * @returns Secure random string in base36
 */
export const generateSecureBase36String = (length: number): string => {
  const safeLength = Math.floor(length)
  if (safeLength <= 0) return ''

  const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
  const randomBytes = new Uint8Array(safeLength)
  crypto.getRandomValues(randomBytes)

  let result = ''
  for (let i = 0; i < randomBytes.length; i++) {
    const randomByte = randomBytes[i]
    if (randomByte !== undefined) {
      const charIndex = randomByte % chars.length
      result += chars[charIndex] || '0'
    }
  }

  return result
}
