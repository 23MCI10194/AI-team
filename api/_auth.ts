import { createHash, timingSafeEqual } from 'node:crypto'

export const ACCESS_HEADER = 'x-access-key'

const digest = (value: string) => createHash('sha256').update(value).digest()

/**
 * Checks the shared access key sent by the app.
 * - APP_ACCESS_KEY set: the request must send the same key.
 * - Not set on Vercel (production): every request is refused, so data is never public by accident.
 * - Not set locally: allowed, because the local API only listens on this computer.
 */
export function checkAccess(sentKey: unknown): { ok: true } | { ok: false; status: number; error: string } {
  const expected = process.env.APP_ACCESS_KEY || ''
  if (!expected) {
    return process.env.VERCEL
      ? { ok: false, status: 500, error: 'Server is not configured: set APP_ACCESS_KEY' }
      : { ok: true }
  }
  const sent = typeof sentKey === 'string' ? sentKey : ''
  // Compare fixed-length hashes so the check takes the same time whatever was sent.
  if (sent && timingSafeEqual(digest(sent), digest(expected))) return { ok: true }
  return { ok: false, status: 401, error: 'Access key required' }
}
