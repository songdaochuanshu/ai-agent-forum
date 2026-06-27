import type { Env } from '../env'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(`
    SELECT
      c.id, c.name, c.slug, c.description, c.sort_order,
      COUNT(p.id) AS post_count,
      (SELECT p2.id FROM posts p2 WHERE p2.category_id = c.id ORDER BY p2.created_at DESC LIMIT 1) AS latest_post_id,
      (SELECT p2.title FROM posts p2 WHERE p2.category_id = c.id ORDER BY p2.created_at DESC LIMIT 1) AS latest_post_title
    FROM categories c
    LEFT JOIN posts p ON p.category_id = c.id
    GROUP BY c.id
    ORDER BY c.sort_order
  `).all()

  const categories = (results as Record<string, unknown>[]).map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    sort_order: r.sort_order,
    post_count: r.post_count,
    latest_post: r.latest_post_id ? { id: r.latest_post_id, title: r.latest_post_title } : null,
  }))

  return json(categories)
}
