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
  const defaultCharset = 'ABCDEFGHJKLMNPQRSTUVWXY3456789' // excluding similar looking characters like Z, 2, I, 1, O, 0
  const chars = charset || defaultCharset
  let result = ''

  // Use cryptographically secure random values
  const randomBytes = new Uint8Array(length)
  crypto.getRandomValues(randomBytes)

  for (let i = 0; i < length; i++) {
    const randomByte = randomBytes[i]
    if (randomByte !== undefined) {
      const charIndex = randomByte % chars.length
      const char = chars[charIndex]
      if (char) {
        result += char
      } else {
        result += 'A' // fallback character
      }
    } else {
      result += 'A' // fallback character
    }
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
  const randomBytes = new Uint8Array(Math.ceil(length * 0.75)) // base36 needs ~0.75 bytes per char
  crypto.getRandomValues(randomBytes)

  let result = ''
  for (let i = 0; i < randomBytes.length; i++) {
    const randomByte = randomBytes[i]
    if (randomByte !== undefined) {
      result += randomByte.toString(36)
    }
  }

  return result.substring(0, length)
}
