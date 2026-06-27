import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import type { Post, Paginated } from '../lib/types'
import { api } from '../lib/api'
import PostCard from '../components/PostCard'
import Pagination from '../components/Pagination'

export default function PostList() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const sort = (searchParams.get('sort') as 'hot' | 'new') || 'hot'
  const page = parseInt(searchParams.get('page') || '1')

  const [data, setData] = useState<Paginated<Post> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getPosts({ category: slug, sort, page })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [slug, sort, page])

  function changeSort(s: 'hot' | 'new') {
    setSearchParams({ sort: s, page: '1' })
  }

  function changePage(p: number) {
    setSearchParams({ sort, page: String(p) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-20">
        <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-800 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          {data?.data[0]?.category?.name ?? slug}
        </h1>
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => changeSort('hot')}
            className={`px-3 py-1.5 rounded-full transition-colors ${sort === 'hot' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            热门
          </button>
          <button
            onClick={() => changeSort('new')}
            className={`px-3 py-1.5 rounded-full transition-colors ${sort === 'new' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            最新
          </button>
        </div>
      </div>

      {data && data.data.length > 0 ? (
        <>
          <div className="grid gap-3">
            {data.data.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <Pagination page={page} totalPages={data.total_pages} onChange={changePage} />
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-sm text-gray-400">暂无帖子</p>
        </div>
      )}
    </div>
  )
}
