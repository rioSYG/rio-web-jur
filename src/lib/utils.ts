/**
 * Base64 encode an ID to be safe for URL segments
 */
export function encodeId(id: string): string {
  if (typeof btoa === 'undefined') {
    return Buffer.from(id).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
  }
  return btoa(id).replace(/\//g, '_').replace(/\+/g, '-');
}

/**
 * Base64 decode an ID from a URL segment
 */
export function decodeId(encoded: string): string {
  const normalized = encoded.replace(/_/g, '/').replace(/-/g, '+');
  if (typeof atob === 'undefined') {
    return Buffer.from(normalized, 'base64').toString('utf8');
  }
  return atob(normalized);
}
