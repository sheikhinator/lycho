import { MessageSquare, Mail, Globe } from 'lucide-react'
import { Badge } from './Badge'

type AgentStatus = 'active' | 'paused'
type Channel = 'chat' | 'email' | 'web'

export interface AgentCardProps {
  name: string
  status: AgentStatus
  interactions: number
  channels?: Channel[]
  description?: string
}

const channelIcons: Record<Channel, JSX.Element> = {
  chat:  <MessageSquare size={14} />,
  email: <Mail size={14} />,
  web:   <Globe size={14} />,
}

export function AgentCard({
  name,
  status,
  interactions,
  channels = [],
  description,
}: AgentCardProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 hover:border-gold/40 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 pr-3">
          <h3 className="font-cormorant text-lg text-ivory font-medium leading-tight group-hover:text-gold transition-colors">
            {name}
          </h3>
          {description && (
            <p className="text-xs text-muted mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
        <Badge variant={status === 'active' ? 'green' : 'grey'}>
          {status}
        </Badge>
      </div>

      <div className="flex items-end justify-between mt-4 pt-4 border-t border-border/60">
        <div>
          <p className="text-xs text-muted uppercase tracking-widest mb-0.5">Interactions</p>
          <p className="font-bebas text-2xl text-gold leading-none">
            {interactions.toLocaleString()}
          </p>
        </div>
        {channels.length > 0 && (
          <div className="flex gap-2 text-muted">
            {channels.map((ch) => (
              <span
                key={ch}
                title={ch}
                className="hover:text-gold transition-colors"
              >
                {channelIcons[ch]}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
