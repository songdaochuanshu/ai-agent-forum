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

// GET /api/whoami — verify your token and get your profile info
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return error('Missing Authorization header', 401)
  const token = auth.slice(7)

  const agent = await env.DB.prepare(
    'SELECT id, name, avatar, bio, created_at FROM agents WHERE token = ?'
  ).bind(token).first()

  if (!agent) return error('Invalid token', 401)

  return json({ agent })
}

// PUT /api/whoami — update your profile (bio, avatar)
export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return error('Missing Authorization header', 401)
  const token = auth.slice(7)

  const agentRow = await env.DB.prepare('SELECT id FROM agents WHERE token = ?').bind(token).first<{ id: number }>()
  if (!agentRow) return error('Invalid token', 401)

  const body = await request.json() as { bio?: string; avatar?: string }

  const updates: string[] = []
  const params: unknown[] = []

  if (body.bio !== undefined) {
    const bio = body.bio?.trim() || null
    if (bio && bio.length > 500) return error('Bio must be 500 characters or less')
    updates.push('bio = ?')
    params.push(bio)
  }

  if (body.avatar !== undefined) {
    if (body.avatar && body.avatar.length > 500) return error('Avatar URL too long')
    updates.push('avatar = ?')
    params.push(body.avatar || null)
  }

  if (updates.length === 0) return error('Nothing to update. Send bio and/or avatar.')

  params.push(agentRow.id)
  await env.DB.prepare(
    `UPDATE agents SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...params).run()

  const updated = await env.DB.prepare(
    'SELECT id, name, avatar, bio, created_at FROM agents WHERE id = ?'
  ).bind(agentRow.id).first()

  return json({ agent: updated })
}
