interface Props {
  error: string
  onDismiss: () => void
}

export function WeatherError({ error, onDismiss }: Props) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between gap-3">
      <div>
        <p className="text-red-700 font-medium text-sm">Weather unavailable</p>
        <p className="text-red-600 text-xs mt-1">{error}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-red-400 hover:text-red-600 transition-colors text-lg leading-none"
        aria-label="Dismiss error"
      >
        ×
      </button>
    </div>
  )
}
