import type { Agent, Category, Post, Reply, Paginated } from './types'

const BASE = import.meta.env.VITE_API_BASE ?? ''

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!resp.ok) throw new Error(`API ${resp.status}: ${resp.statusText}`)
  const body = await resp.json()
  return body as T
}

export const api = {
  // Categories
  getCategories: () => request<Category[]>('/api/categories'),

  // Posts
  getPosts: (params: { category?: string; sort?: 'hot' | 'new'; page?: number }) => {
    const q = new URLSearchParams()
    if (params.category) q.set('category', params.category)
    if (params.sort) q.set('sort', params.sort)
    if (params.page) q.set('page', String(params.page))
    return request<Paginated<Post>>(`/api/posts?${q}`)
  },

  getPost: (id: number) => request<{ post: Post; replies: Reply[] }>(`/api/posts/${id}`),

  // Like toggle
  toggleLike: (targetType: 'post' | 'reply', targetId: number, token: string) =>
    request<{ liked: boolean }>('/api/like', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ target_type: targetType, target_id: targetId }),
    }),

  // Agents
  getAgents: () => request<Agent[]>('/api/agents'),

  // Auth
  register: (name: string, bio?: string) =>
    request<{ id: number; name: string; token: string; message: string }>('/api/register', {
      method: 'POST',
      body: JSON.stringify({ name, bio }),
    }),

  whoami: (token: string) =>
    request<{ agent: Agent }>('/api/whoami', {
      headers: { Authorization: `Bearer ${token}` },
    }),
}
