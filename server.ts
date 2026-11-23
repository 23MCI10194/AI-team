import express from 'express'
import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { ACCESS_HEADER, checkAccess } from './api/_auth.js'

type Candidate = { id: string; updatedAt: string; [key: string]: unknown }

mkdirSync(join(process.cwd(), 'data'), { recursive: true })
const db = new Database(join(process.cwd(), 'data', 'candidates.sqlite'))
db.pragma('journal_mode = WAL')
db.exec(`CREATE TABLE IF NOT EXISTS candidates (id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL)`)

const app = express()
app.use(express.json({ limit: '4mb' })) // same request limit as Vercel, so size problems show up locally too
app.use('/api/candidates', (req, res, next) => {
  if (req.method === 'GET' && req.query.health !== undefined) return next()
  const access = checkAccess(req.get(ACCESS_HEADER))
  return access.ok ? next() : res.status(access.status).json({ error: access.error })
})

const list = () => db.prepare('SELECT payload FROM candidates ORDER BY updated_at DESC').all().map((row: any) => JSON.parse(row.payload))
const upsert = db.prepare('INSERT INTO candidates (id, payload, updated_at) VALUES (@id, @payload, @updatedAt) ON CONFLICT(id) DO UPDATE SET payload = @payload, updated_at = @updatedAt')
const remove = db.prepare('DELETE FROM candidates WHERE id = ?')

app.get('/api/health', (_req, res) => res.json({ ok: true, database: 'sqlite' }))
app.get('/api/candidates', (req, res) => req.query.health !== undefined ? res.json({ ok: true, database: 'sqlite' }) : res.json(list()))
app.get('/api/candidates/:id', (req, res) => {
  const row: any = db.prepare('SELECT payload FROM candidates WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Candidate not found' })
  return res.json(JSON.parse(row.payload))
})
app.post('/api/candidates', (req, res) => {
  const candidate = req.body as Candidate
  if (!candidate?.id) return res.status(400).json({ error: 'Candidate id is required' })
  upsert.run({ id: candidate.id, payload: JSON.stringify(candidate), updatedAt: candidate.updatedAt || new Date().toISOString() })
  return res.status(201).json(candidate)
})
app.put('/api/candidates', (req, res) => {
  const candidates = (Array.isArray(req.body) ? req.body as Candidate[] : []).filter(c => c?.id)
  const transaction = db.transaction((items: Candidate[]) => items.forEach(candidate => upsert.run({ id: candidate.id, payload: JSON.stringify(candidate), updatedAt: candidate.updatedAt || new Date().toISOString() })))
  transaction(candidates)
  return res.json(list())
})
app.delete('/api/candidates/:id', (req, res) => { remove.run(req.params.id); return res.status(204).end() })
app.delete('/api/candidates', (req, res) => {
  const id = String(req.query.id || '')
  if (!id) return res.status(400).json({ error: 'Candidate id is required' })
  remove.run(id)
  return res.status(204).end()
})

app.listen(3001, '127.0.0.1', () => console.log('SQLite API running at http://localhost:3001'))
