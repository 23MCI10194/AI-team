import { neon } from '@neondatabase/serverless'
import { ACCESS_HEADER, checkAccess } from './_auth.js'

type Candidate = { id: string; updatedAt?: string; [key: string]: unknown }

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || ''
const sql = connectionString ? neon(connectionString) : null

// Create the table once per cold start instead of on every request.
let tableReady: Promise<unknown> | null = null
const ensureTable = () => tableReady ??= sql!`CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`.catch(error => { tableReady = null; throw error })

export default async function handler(req: any, res: any) {
  // The app calls this API from its own origin, so no CORS headers are sent:
  // browsers will refuse cross-site requests from other websites.
  res.setHeader('Cache-Control', 'no-store')

  if (!sql) return res.status(500).json({ error: 'Database is not configured: set POSTGRES_URL or DATABASE_URL' })

  const isHealthCheck = req.method === 'GET' && req.query?.health !== undefined
  if (!isHealthCheck) {
    const access = checkAccess(req.headers?.[ACCESS_HEADER])
    if (!access.ok) return res.status(access.status).json({ error: access.error })
  }

  try {
    await ensureTable()

    if (req.method === 'GET') {
      if (isHealthCheck) return res.status(200).json({ ok: true, database: 'postgres' })
      const rows = await sql`SELECT payload FROM candidates ORDER BY updated_at DESC`
      return res.status(200).json(rows.map(row => row.payload))
    }

    // Bulk upsert (used by Excel import and first-time migration from browser storage).
    // Merges into existing data; never deletes records that are not in the request.
    if (req.method === 'PUT') {
      const candidates = (Array.isArray(req.body) ? req.body as Candidate[] : []).filter(c => c?.id)
      if (candidates.length) {
        await sql`INSERT INTO candidates (id, payload, updated_at)
          SELECT c->>'id', c, COALESCE((c->>'updatedAt')::timestamptz, NOW())
          FROM jsonb_array_elements(${JSON.stringify(candidates)}::jsonb) AS c
          ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at`
      }
      const rows = await sql`SELECT payload FROM candidates ORDER BY updated_at DESC`
      return res.status(200).json(rows.map(row => row.payload))
    }

    if (req.method === 'POST') {
      const candidate = req.body as Candidate
      if (!candidate?.id) return res.status(400).json({ error: 'Candidate id is required' })
      await sql`INSERT INTO candidates (id, payload, updated_at)
        VALUES (${candidate.id}, ${JSON.stringify(candidate)}::jsonb, ${candidate.updatedAt || new Date().toISOString()})
        ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at`
      return res.status(201).json(candidate)
    }

    if (req.method === 'DELETE') {
      const id = String(req.query?.id || '')
      if (!id) return res.status(400).json({ error: 'Candidate id is required' })
      await sql`DELETE FROM candidates WHERE id = ${id}`
      return res.status(204).end()
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Candidate API error', error)
    return res.status(500).json({ error: 'Database connection is unavailable' })
  }
}
