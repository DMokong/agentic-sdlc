interface Props {
  error: string
  onDismiss: () => void
  onOpenSettings?: () => void
}

export function TransportError({ error, onDismiss, onOpenSettings }: Props) {
  const isApiKeyError = error === 'API_KEY_MISSING' || error === 'API_KEY_INVALID'

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between gap-3">
      <div className="flex-1">
        {isApiKeyError ? (
          <>
            <p className="text-red-700 font-medium text-sm">Transport API key not configured</p>
            <p className="text-red-600 text-xs mt-1">
              Add your TfNSW API key to .env as VITE_TFNSW_API_KEY.
            </p>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="mt-2 text-xs text-blue-600 underline hover:text-blue-800"
              >
                Open settings
              </button>
            )}
          </>
        ) : (
          <>
            <p className="text-red-700 font-medium text-sm">Departures unavailable</p>
            <p className="text-red-600 text-xs mt-1">{error}</p>
          </>
        )}
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
