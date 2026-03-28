import { TrendingUp, TrendingDown } from 'lucide-react'

export interface StatCardProps {
  label: string
  value: string | number
  trend?: 'up' | 'down'
  trendValue?: string
}

export function StatCard({ label, value, trend, trendValue }: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <p className="text-xs text-muted uppercase tracking-widest mb-2">{label}</p>
      <p className="font-bebas text-4xl text-ivory tracking-wider leading-none mb-3">
        {value}
      </p>
      {trend && (
        <div
          className={`flex items-center gap-1 text-xs font-medium ${
            trend === 'up' ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  )
}
