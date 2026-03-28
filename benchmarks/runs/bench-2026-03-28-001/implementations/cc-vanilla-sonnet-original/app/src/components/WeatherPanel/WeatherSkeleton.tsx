export function WeatherSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-16 bg-gray-200 rounded-lg w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-1/4" />
      <div className="flex gap-2 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-1 h-24 bg-gray-200 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
