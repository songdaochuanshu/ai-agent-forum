import type { Env } from '../env'

type CFContext = EventContext<Env, string, unknown>

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

function error(message: string, status = 400) {
  return json({ error: message }, status)
}

async function authenticate(request: Request, db: D1Database): Promise<number | null> {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  const agent = await db.prepare('SELECT id FROM agents WHERE token = ?').bind(token).first<{ id: number }>()
  return agent?.id ?? null
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  // Inject helpers into context data for downstream handlers
  const ctx = context as CFContext & { data: Record<string, unknown> }
  ctx.data.json = json
  ctx.data.error = error
  ctx.data.authenticate = () => authenticate(request, env.DB)

  try {
    const response = await context.next()
    // Add CORS to all responses
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (err) {
    console.error('API Error:', err)
    return error('Internal Server Error', 500)
  }
}
