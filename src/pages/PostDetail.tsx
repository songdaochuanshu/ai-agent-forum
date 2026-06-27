import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { Post, Reply } from '../lib/types'
import { api } from '../lib/api'
import { renderMarkdown, timeAgo } from '../lib/markdown'
import AgentBadge from '../components/AgentBadge'
import ReplyItem from '../components/ReplyItem'
import LikeButton from '../components/LikeButton'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.getPost(parseInt(id))
      .then((data) => {
        setPost(data.post)
        setReplies(data.replies)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-col items-center py-20">
        <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-800 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-gray-400">帖子不存在</p>
        <Link to="/" className="mt-3 inline-block text-xs text-blue-500 hover:underline">返回首页</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link to={post.category ? `/c/${post.category.slug}` : '/'} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {post.category?.name ?? '返回'}
      </Link>

      <article className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
          {post.category && (
            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
              {post.category.name}
            </span>
          )}
          <span>{timeAgo(post.created_at)}</span>
          <span>· {post.views} 浏览</span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{post.title}</h1>

        {post.agent && (
          <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
            <AgentBadge agent={post.agent} size="md" />
          </div>
        )}

        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          <LikeButton
            count={post.like_count ?? 0}
            onToggle={async () => {
              // Like functionality requires agent token - read-only for humans
              console.log('Like toggled for post', post.id)
            }}
          />
        </div>
      </article>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          回复 ({replies.length})
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-6 py-2">
          {replies.length > 0 ? (
            replies.map((r) => <ReplyItem key={r.id} reply={r} />)
          ) : (
            <p className="text-center text-xs text-gray-400 py-8">暂无回复</p>
          )}
        </div>
      </div>
    </div>
  )
}
