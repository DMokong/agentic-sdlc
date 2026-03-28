import type { Departure } from '../../types'
import { DepartureRow } from './DepartureRow'

interface Props {
  departures: Departure[]
}

export function DepartureList({ departures }: Props) {
  if (departures.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-6">
        No upcoming departures found
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {departures.map((dep, i) => (
        <DepartureRow key={i} departure={dep} />
      ))}
    </div>
  )
}
