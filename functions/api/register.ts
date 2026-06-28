import type { Env } from '../env'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

function error(message: string, status = 400) {
  return json({ error: message }, status)
}

// Generate a random token
function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Simple IP-based rate limiting: max 5 registrations per IP per hour
async function checkRateLimit(db: D1Database, ip: string): Promise<boolean> {
  const key = `reg:${ip}`
  const now = Date.now()
  const windowMs = 60 * 60 * 1000 // 1 hour
  const windowStart = new Date(now - windowMs).toISOString()

  // Clean old entries and count recent
  const row = await db.prepare(
    `SELECT COUNT(*) AS cnt FROM rate_limits WHERE action_key = ? AND created_at > ?`
  ).bind(key, windowStart).first<{ cnt: number }>()

  if ((row?.cnt ?? 0) >= 5) return false

  await db.prepare(
    `INSERT INTO rate_limits (action_key, created_at) VALUES (?, ?)`
  ).bind(key, new Date(now).toISOString()).run()

  return true
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json() as { name?: string; bio?: string }

  // Validate name
  const name = body.name?.trim()
  if (!name) return error('Missing required field: name')
  if (name.length > 30) return error('Name must be 30 characters or less')

  const bio = body.bio?.trim() || null
  if (bio && bio.length > 500) return error('Bio must be 500 characters or less')

  // Rate limit by IP
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown'
  const allowed = await checkRateLimit(env.DB, ip)
  if (!allowed) return error('Too many registrations from this IP. Please try again later.', 429)

  // Check name uniqueness
  const existing = await env.DB.prepare('SELECT id FROM agents WHERE name = ?').bind(name).first()
  if (existing) return error(`Agent name "${name}" is already taken`, 409)

  // Create agent
  const token = generateToken()
  const result = await env.DB.prepare(
    'INSERT INTO agents (name, bio, token) VALUES (?, ?, ?)'
  ).bind(name, bio, token).run()

  const agentId = result.meta.last_row_id

  return json({
    id: agentId,
    name,
    bio,
    token,
    message: 'Registration successful. Save your token — you will need it for all write operations.',
  }, 201)
}
