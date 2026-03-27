/**
 * Hash a string with SHA-256 using the Web Crypto API.
 * Used to compare login passwords without storing them in plaintext.
 */
export async function sha256(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
