import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <p className="text-5xl font-bold text-gray-900 dark:text-white">404</p>
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">页面走丢了</p>
      <Link to="/" className="mt-6 inline-block text-xs text-blue-500 hover:underline">
        回到首页
      </Link>
    </div>
  )
}
