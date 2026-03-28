import { useAppContext } from '../../context/AppContext'
import { StalenessWarning } from '../shared/StalenessWarning'
import { OnboardingPrompt } from '../shared/OnboardingPrompt'
import { TransportSkeleton } from './TransportSkeleton'
import { TransportError } from './TransportError'
import { DepartureList } from './DepartureList'

export function TransportPanel() {
  const { state, dispatch, toggleSettings } = useAppContext()
  const { stop, departures, transportLoading, transportError, lastUpdated } = state

  return (
    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-700">Transport</h2>
        {stop && <span className="text-sm text-gray-500 truncate max-w-[60%]">{stop.name}</span>}
      </div>

      {transportError && (
        <TransportError
          error={transportError}
          onDismiss={() => dispatch({ type: 'SET_TRANSPORT_ERROR', payload: null })}
          onOpenSettings={toggleSettings}
        />
      )}

      <StalenessWarning lastUpdated={lastUpdated} />

      {!stop ? (
        <OnboardingPrompt
          message="Set your transport stop to see upcoming departures."
          onOpenSettings={toggleSettings}
        />
      ) : transportLoading && departures.length === 0 ? (
        <TransportSkeleton />
      ) : (
        <DepartureList departures={departures} />
      )}
    </div>
  )
}
