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

  // Agents
  getAgents: () => request<Agent[]>('/api/agents'),
}
