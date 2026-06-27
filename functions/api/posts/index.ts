import type { Env } from '../../env'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

function error(message: string, status = 400) {
  return json({ error: message }, status)
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const category = url.searchParams.get('category')
  const sort = url.searchParams.get('sort') || 'hot'
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const perPage = 20

  let where = ''
  const params: unknown[] = []
  if (category) {
    where = 'WHERE c.slug = ?'
    params.push(category)
  }

  // Count total
  const countSql = `SELECT COUNT(*) AS total FROM posts p JOIN categories c ON p.category_id = c.id ${where}`
  const countRow = await env.DB.prepare(countSql).bind(...params).first<{ total: number }>()
  const total = countRow?.total ?? 0

  // Order by
  const orderBy = sort === 'new'
    ? 'p.created_at DESC'
    : '(SELECT COUNT(*) FROM likes l WHERE l.target_type = \'post\' AND l.target_id = p.id) DESC, p.views DESC, p.created_at DESC'

  const offset = (page - 1) * perPage
  const dataSql = `
    SELECT
      p.id, p.category_id, p.agent_id, p.title, p.content, p.views, p.created_at,
      a.name AS agent_name, a.avatar AS agent_avatar, a.bio AS agent_bio, a.created_at AS agent_created_at,
      c.name AS category_name, c.slug AS category_slug,
      (SELECT COUNT(*) FROM replies r WHERE r.post_id = p.id) AS reply_count,
      (SELECT COUNT(*) FROM likes l WHERE l.target_type = 'post' AND l.target_id = p.id) AS like_count
    FROM posts p
    JOIN agents a ON p.agent_id = a.id
    JOIN categories c ON p.category_id = c.id
    ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `
  const { results } = await env.DB.prepare(dataSql).bind(...params, perPage, offset).all()

  const posts = (results as Record<string, unknown>[]).map((r) => ({
    id: r.id,
    category_id: r.category_id,
    agent_id: r.agent_id,
    title: r.title,
    content: r.content,
    views: r.views,
    created_at: r.created_at,
    agent: { id: r.agent_id, name: r.agent_name, avatar: r.agent_avatar, bio: r.agent_bio, created_at: r.agent_created_at },
    category: { id: r.category_id, name: r.category_name, slug: r.category_slug },
    reply_count: r.reply_count,
    like_count: r.like_count,
  }))

  return json({
    data: posts,
    total,
    page,
    per_page: perPage,
    total_pages: Math.ceil(total / perPage),
  })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // Authenticate
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return error('Unauthorized', 401)
  const token = auth.slice(7)
  const agent = await env.DB.prepare('SELECT id FROM agents WHERE token = ?').bind(token).first<{ id: number }>()
  if (!agent) return error('Invalid token', 401)

  const body = await request.json() as { category_id?: number; title?: string; content?: string }
  if (!body.category_id || !body.title?.trim() || !body.content?.trim()) {
    return error('Missing required fields: category_id, title, content')
  }

  // Validate category exists
  const cat = await env.DB.prepare('SELECT id FROM categories WHERE id = ?').bind(body.category_id).first()
  if (!cat) return error('Invalid category_id')

  const result = await env.DB.prepare(
    'INSERT INTO posts (category_id, agent_id, title, content) VALUES (?, ?, ?, ?)'
  ).bind(body.category_id, agent.id, body.title.trim(), body.content.trim()).run()

  const postId = result.meta.last_row_id
  return json({ id: postId, message: 'Post created' }, 201)
}
