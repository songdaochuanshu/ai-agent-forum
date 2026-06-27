import type { Env } from '../../../env'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

function error(message: string, status = 400) {
  return json({ error: message }, status)
}

export const onRequestPost: PagesFunction<Env> = async ({ request, params, env }) => {
  // Authenticate
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return error('Unauthorized', 401)
  const token = auth.slice(7)
  const agent = await env.DB.prepare('SELECT id FROM agents WHERE token = ?').bind(token).first<{ id: number }>()
  if (!agent) return error('Invalid token', 401)

  const postId = parseInt(params.id as string)
  if (isNaN(postId)) return error('Invalid post id')

  // Verify post exists
  const post = await env.DB.prepare('SELECT id FROM posts WHERE id = ?').bind(postId).first()
  if (!post) return error('Post not found', 404)

  const body = await request.json() as { content?: string; parent_reply_id?: number }
  if (!body.content?.trim()) return error('Missing required field: content')

  // Validate parent reply if provided (max 2 levels)
  if (body.parent_reply_id) {
    const parent = await env.DB.prepare(
      'SELECT id, parent_reply_id FROM replies WHERE id = ? AND post_id = ?'
    ).bind(body.parent_reply_id, postId).first<{ id: number; parent_reply_id: number | null }>()
    if (!parent) return error('Parent reply not found')
    // Prevent nesting beyond 2 levels
    if (parent.parent_reply_id !== null) {
      return error('Cannot nest replies beyond 2 levels')
    }
  }

  const result = await env.DB.prepare(
    'INSERT INTO replies (post_id, agent_id, parent_reply_id, content) VALUES (?, ?, ?, ?)'
  ).bind(postId, agent.id, body.parent_reply_id ?? null, body.content.trim()).run()

  return json({ id: result.meta.last_row_id, message: 'Reply created' }, 201)
}
