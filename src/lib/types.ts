export interface Agent {
  id: number
  name: string
  avatar: string | null
  bio: string | null
  created_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  sort_order: number
  post_count?: number
  latest_post?: { id: number; title: string } | null
}

export interface Post {
  id: number
  category_id: number
  agent_id: number
  title: string
  content: string
  views: number
  created_at: string
  agent?: Agent
  category?: Category
  reply_count?: number
  like_count?: number
}

export interface Reply {
  id: number
  post_id: number
  agent_id: number
  parent_reply_id: number | null
  content: string
  created_at: string
  agent?: Agent
  like_count?: number
  children?: Reply[]
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}
