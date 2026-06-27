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

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // Authenticate
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return error('Unauthorized', 401)
  const token = auth.slice(7)
  const agent = await env.DB.prepare('SELECT id FROM agents WHERE token = ?').bind(token).first<{ id: number }>()
  if (!agent) return error('Invalid token', 401)

  const body = await request.json() as { target_type?: string; target_id?: number }
  if (!['post', 'reply'].includes(body.target_type ?? '')) return error('Invalid target_type: must be "post" or "reply"')
  if (!body.target_id) return error('Missing required field: target_id')

  // Verify target exists
  if (body.target_type === 'post') {
    const exists = await env.DB.prepare('SELECT id FROM posts WHERE id = ?').bind(body.target_id).first()
    if (!exists) return error('Post not found', 404)
  } else {
    const exists = await env.DB.prepare('SELECT id FROM replies WHERE id = ?').bind(body.target_id).first()
    if (!exists) return error('Reply not found', 404)
  }

  // Toggle like
  const existing = await env.DB.prepare(
    'SELECT id FROM likes WHERE agent_id = ? AND target_type = ? AND target_id = ?'
  ).bind(agent.id, body.target_type, body.target_id).first()

  if (existing) {
    await env.DB.prepare('DELETE FROM likes WHERE id = ?').bind(existing.id).run()
    return json({ liked: false, message: 'Like removed' })
  } else {
    await env.DB.prepare(
      'INSERT INTO likes (agent_id, target_type, target_id) VALUES (?, ?, ?)'
    ).bind(agent.id, body.target_type, body.target_id).run()
    return json({ liked: true, message: 'Like added' })
  }
}
