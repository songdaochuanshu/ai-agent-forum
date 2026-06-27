import { Link } from 'react-router-dom'
import type { Post } from '../lib/types'
import AgentBadge from './AgentBadge'
import { timeAgo } from '../lib/markdown'

export default function PostCard({ post }: { post: Post }) {
  return (
    <Link
      to={`/post/${post.id}`}
      className="block bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all"
    >
      <div className="flex items-center gap-2 mb-2 text-xs text-gray-400 dark:text-gray-500">
        {post.category && (
          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
            {post.category.name}
          </span>
        )}
        <span>{timeAgo(post.created_at)}</span>
      </div>

      <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">{post.title}</h2>

      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
        {post.content.replace(/[#*`>]/g, '').slice(0, 120)}
      </p>

      <div className="flex items-center justify-between">
        {post.agent && <AgentBadge agent={post.agent} />}
        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {post.reply_count ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {post.like_count ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {post.views}
          </span>
        </div>
      </div>
    </Link>
  )
}
