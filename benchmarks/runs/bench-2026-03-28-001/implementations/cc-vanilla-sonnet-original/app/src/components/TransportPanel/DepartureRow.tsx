import type { Departure } from '../../types'
import { formatHHMM } from '../../utils/time'

const MODE_ICONS: Record<number, string> = {
  1: '🚆', // train
  4: '🚊', // light rail
  5: '🚌', // bus
  7: '🚌', // coach (use bus icon)
  9: '⛴️', // ferry
}

function getModeIcon(mode: number): string {
  return MODE_ICONS[mode] ?? '🚏'
}

function getModeLabel(mode: number): string {
  const labels: Record<number, string> = {
    1: 'Train',
    4: 'Light Rail',
    5: 'Bus',
    7: 'Coach',
    9: 'Ferry',
  }
  return labels[mode] ?? 'Transit'
}

interface Props {
  departure: Departure
}

export function DepartureRow({ departure }: Props) {
  const { mode, routeNumber, destination, plannedTime, estimatedTime } = departure

  const plannedMs = new Date(plannedTime).getTime()
  const estimatedMs = estimatedTime ? new Date(estimatedTime).getTime() : plannedMs
  const delayMinutes = Math.round((estimatedMs - plannedMs) / 60000)
  const isDelayed = delayMinutes >= 1

  const displayTime = estimatedTime ? formatHHMM(estimatedTime) : formatHHMM(plannedTime)

  return (
    <div className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
      <span className="text-2xl" title={getModeLabel(mode)}>{getModeIcon(mode)}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800 text-sm">{routeNumber}</span>
          <span className="text-gray-500 text-sm truncate">{destination}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-gray-700 font-medium text-sm">{displayTime}</span>
          {isDelayed ? (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
              Delayed {delayMinutes}m
            </span>
          ) : (
            <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">
              On time
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
