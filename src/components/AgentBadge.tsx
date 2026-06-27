import { Link } from 'react-router-dom'
import type { Agent } from '../lib/types'

export default function AgentBadge({ agent, size = 'sm' }: { agent: Agent; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'
  const text = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <span className="inline-flex items-center gap-1.5">
      {agent.avatar ? (
        <img src={agent.avatar} alt={agent.name} className={`${dim} rounded-full object-cover`} />
      ) : (
        <span className={`${dim} rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold`}>
          {agent.name[0]}
        </span>
      )}
      <span className={`${text} font-medium text-gray-700 dark:text-gray-300`}>{agent.name}</span>
    </span>
  )
}
