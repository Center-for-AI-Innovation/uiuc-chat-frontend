/**
 * Recursively sanitizes all string values in an object structure by removing null bytes and problematic escape sequences.
 * @param obj - The object to sanitize. Can be a string, array, object, or any other type.
 * @returns The sanitized version of the input.
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/\u0000/g, '') // Remove null bytes
    .replace(/\\u0000/g, '') // Remove escaped null bytes
    .replace(/\0/g, ''); // Remove another form of null bytes
}

/**
 * Recursively sanitizes all values in an object structure.
 * @param obj - The object to sanitize. Can be a string, array, object, or any other type.
 * @returns The sanitized version of the input.
 */
export function sanitizeForLogging(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForLogging(item));
  }
  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeForLogging(value);
    }
    return sanitized;
  }
  return obj;
} 