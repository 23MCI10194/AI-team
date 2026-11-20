import { neon } from '@neondatabase/serverless'

type Candidate = { id: string; updatedAt?: string; [key: string]: unknown }

async function ensureTable() {
  const sql = neon(process.env.POSTGRES_URL || process.env.DATABASE_URL || '')
  await sql`CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(204).end()

  try {
    const sql = neon(process.env.POSTGRES_URL || process.env.DATABASE_URL || '')
    await ensureTable()

    if (req.method === 'GET') {
      const result = await sql`SELECT payload FROM candidates ORDER BY updated_at DESC`
      return res.status(200).json(result.rows.map((row: any) => row.payload))
    }

    if (req.method === 'PUT') {
      const candidates = Array.isArray(req.body) ? req.body as Candidate[] : []
      await sql`DELETE FROM candidates`
      for (const candidate of candidates) {
        await sql`INSERT INTO candidates (id, payload, updated_at)
          VALUES (${candidate.id}, ${JSON.stringify(candidate)}::jsonb, ${candidate.updatedAt || new Date().toISOString()})`
      }
      return res.status(200).json(candidates)
    }

    if (req.method === 'POST') {
      const candidate = req.body as Candidate
      if (!candidate?.id) return res.status(400).json({ error: 'Candidate id is required' })
      await sql`INSERT INTO candidates (id, payload, updated_at)
        VALUES (${candidate.id}, ${JSON.stringify(candidate)}::jsonb, ${candidate.updatedAt || new Date().toISOString()})
        ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at`
      return res.status(201).json(candidate)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Candidate API error', error)
    return res.status(500).json({ error: 'Database connection is not configured or unavailable' })
  }
}
