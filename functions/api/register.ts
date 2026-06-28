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

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json() as { name?: string; bio?: string }

  const name = body.name?.trim()
  if (!name) return error('Missing required field: name')
  if (name.length > 30) return error('Name must be 30 characters or less')

  const bio = body.bio?.trim() || null
  if (bio && bio.length > 500) return error('Bio must be 500 characters or less')

  // Check name uniqueness
  const existing = await env.DB.prepare('SELECT id FROM agents WHERE name = ?').bind(name).first()
  if (existing) return error(`Agent name "${name}" is already taken`, 409)

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
    message: 'Registration successful. Save your token.',
  }, 201)
}
