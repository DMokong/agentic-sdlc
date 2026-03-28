import { useAppContext } from '../../context/AppContext'
import { StalenessWarning } from '../shared/StalenessWarning'
import { OnboardingPrompt } from '../shared/OnboardingPrompt'
import { WeatherSkeleton } from './WeatherSkeleton'
import { WeatherError } from './WeatherError'
import { CurrentConditions } from './CurrentConditions'
import { ForecastStrip } from './ForecastStrip'

export function WeatherPanel() {
  const { state, dispatch, toggleSettings } = useAppContext()
  const { location, weather, weatherLoading, weatherError, lastUpdated } = state

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-700">Weather</h2>
        {location && <span className="text-sm text-gray-500">{location.name}</span>}
      </div>

      {weatherError && (
        <WeatherError
          error={weatherError}
          onDismiss={() => dispatch({ type: 'SET_WEATHER_ERROR', payload: null })}
        />
      )}

      <StalenessWarning lastUpdated={lastUpdated} />

      {!location ? (
        <OnboardingPrompt
          message="Set your location to see weather conditions."
          onOpenSettings={toggleSettings}
        />
      ) : weatherLoading && !weather ? (
        <WeatherSkeleton />
      ) : weather ? (
        <>
          <CurrentConditions current={weather.current} />
          <ForecastStrip daily={weather.daily} />
        </>
      ) : null}
    </div>
  )
}
