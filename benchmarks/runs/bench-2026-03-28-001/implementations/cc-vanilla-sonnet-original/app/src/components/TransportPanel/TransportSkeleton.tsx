export function TransportSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-14 bg-gray-200 rounded-lg" />
      ))}
    </div>
  )
}
