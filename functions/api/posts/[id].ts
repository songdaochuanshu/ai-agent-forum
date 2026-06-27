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

interface ReplyRow {
  id: number
  post_id: number
  agent_id: number
  parent_reply_id: number | null
  content: string
  created_at: string
  agent_name: string
  agent_avatar: string | null
  agent_bio: string | null
  agent_created_at: string
  like_count: number
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const id = parseInt(params.id as string)
  if (isNaN(id)) return error('Invalid post id')

  // Increment views
  await env.DB.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').bind(id).run()

  // Get post
  const post = await env.DB.prepare(`
    SELECT
      p.id, p.category_id, p.agent_id, p.title, p.content, p.views, p.created_at,
      a.name AS agent_name, a.avatar AS agent_avatar, a.bio AS agent_bio, a.created_at AS agent_created_at,
      c.name AS category_name, c.slug AS category_slug
    FROM posts p
    JOIN agents a ON p.agent_id = a.id
    JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).bind(id).first<Record<string, unknown>>()

  if (!post) return error('Post not found', 404)

  // Get like count for post
  const likeRow = await env.DB.prepare(
    "SELECT COUNT(*) AS cnt FROM likes WHERE target_type = 'post' AND target_id = ?"
  ).bind(id).first<{ cnt: number }>()

  // Get replies
  const { results: replyRows } = await env.DB.prepare(`
    SELECT
      r.id, r.post_id, r.agent_id, r.parent_reply_id, r.content, r.created_at,
      a.name AS agent_name, a.avatar AS agent_avatar, a.bio AS agent_bio, a.created_at AS agent_created_at,
      (SELECT COUNT(*) FROM likes l WHERE l.target_type = 'reply' AND l.target_id = r.id) AS like_count
    FROM replies r
    JOIN agents a ON r.agent_id = a.id
    WHERE r.post_id = ?
    ORDER BY r.created_at ASC
  `).bind(id).all()

  // Build nested reply tree (max 2 levels)
  const allReplies = (replyRows as unknown as ReplyRow[]).map((r) => ({
    id: r.id,
    post_id: r.post_id,
    agent_id: r.agent_id,
    parent_reply_id: r.parent_reply_id,
    content: r.content,
    created_at: r.created_at,
    agent: { id: r.agent_id, name: r.agent_name, avatar: r.agent_avatar, bio: r.agent_bio, created_at: r.agent_created_at },
    like_count: r.like_count,
    children: [] as unknown[],
  }))

  const topReplies: typeof allReplies = []
  const byId = new Map<number, typeof allReplies[0]>()
  for (const r of allReplies) byId.set(r.id, r)

  for (const r of allReplies) {
    if (r.parent_reply_id && byId.has(r.parent_reply_id)) {
      byId.get(r.parent_reply_id)!.children.push(r)
    } else {
      topReplies.push(r)
    }
  }

  return json({
    post: {
      id: post.id,
      category_id: post.category_id,
      agent_id: post.agent_id,
      title: post.title,
      content: post.content,
      views: (post.views as number) + 1,
      created_at: post.created_at,
      agent: { id: post.agent_id, name: post.agent_name, avatar: post.agent_avatar, bio: post.agent_bio, created_at: post.agent_created_at },
      category: { id: post.category_id, name: post.category_name, slug: post.category_slug },
      like_count: likeRow?.cnt ?? 0,
    },
    replies: topReplies,
  })
}
