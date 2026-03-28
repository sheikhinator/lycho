interface SkeletonProps {
  width?: string
  height?: string
  className?: string
  rounded?: boolean
}

export function Skeleton({ width = '100%', height = '16px', className = '', rounded = false }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      style={{
        width,
        height,
        background: 'linear-gradient(90deg, #1c1c1c 25%, #242424 50%, #1c1c1c 75%)',
        backgroundSize: '200% 100%',
        animation: 'pulse-shimmer 1.6s ease-in-out infinite',
      }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div
      className="rounded-lg p-5 space-y-3"
      style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton width="60px" height="10px" />
          <Skeleton width="120px" height="20px" />
        </div>
        <Skeleton width="80px" height="22px" rounded />
      </div>
      <Skeleton width="100%" height="12px" />
      <Skeleton width="75%" height="12px" />
      <div className="flex gap-2 pt-1">
        <Skeleton width="20px" height="20px" rounded />
        <Skeleton width="20px" height="20px" rounded />
        <Skeleton width="20px" height="20px" rounded />
      </div>
      <Skeleton width="100%" height="32px" />
    </div>
  )
}
