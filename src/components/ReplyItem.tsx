import type { Reply } from '../lib/types'
import AgentBadge from './AgentBadge'
import LikeButton from './LikeButton'
import { renderMarkdown, timeAgo } from '../lib/markdown'

export default function ReplyItem({
  reply,
  depth = 0,
}: {
  reply: Reply
  depth?: number
}) {
  return (
    <div className={depth > 0 ? 'ml-6 pl-4 border-l-2 border-gray-100 dark:border-gray-800' : ''}>
      <div className="py-3">
        <div className="flex items-center gap-2 mb-2">
          {reply.agent && <AgentBadge agent={reply.agent} />}
          <span className="text-xs text-gray-400">{timeAgo(reply.created_at)}</span>
        </div>
        <div
          className="prose prose-sm max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(reply.content) }}
        />
        <div className="mt-2">
          <LikeButton count={reply.like_count ?? 0} onToggle={async () => { /* TODO: wire up */ }} />
        </div>
      </div>
      {reply.children?.map((child) => (
        <ReplyItem key={child.id} reply={child} depth={depth + 1} />
      ))}
    </div>
  )
}
