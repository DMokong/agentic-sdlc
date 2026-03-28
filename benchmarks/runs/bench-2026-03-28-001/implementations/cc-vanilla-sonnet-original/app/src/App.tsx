import { useEffect, useRef, useCallback } from 'react'
import { AppProvider, useAppContext } from './context/AppContext'
import { useWeather } from './hooks/useWeather'
import { useTransport } from './hooks/useTransport'
import { Header } from './components/Header'
import { SettingsPanel } from './components/SettingsPanel'
import { WeatherPanel } from './components/WeatherPanel'
import { TransportPanel } from './components/TransportPanel'

const REFRESH_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

function AppInner() {
  const { state, dispatch } = useAppContext()
  const { fetchWeather } = useWeather()
  const { fetchDepartures } = useTransport()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const doRefresh = useCallback(async () => {
    const results = await Promise.all([
      state.location ? fetchWeather(state.location) : Promise.resolve(false),
      state.stop ? fetchDepartures(state.stop) : Promise.resolve(false),
    ])
    const weatherOk = !state.location || results[0]
    const transportOk = !state.stop || results[1]
    if (weatherOk && transportOk) {
      dispatch({ type: 'SET_LAST_UPDATED', payload: new Date() })
    }
  }, [state.location, state.stop, fetchWeather, fetchDepartures, dispatch])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      doRefresh()
    }, REFRESH_INTERVAL_MS)
  }, [doRefresh])

  // Initial fetch on mount or when location/stop changes
  useEffect(() => {
    doRefresh()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.location?.name, state.stop?.id])

  // Setup auto-refresh timer
  useEffect(() => {
    startTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [startTimer])

  const handleManualRefresh = () => {
    doRefresh()
    startTimer() // reset timer
  }

  const isRefreshing = state.weatherLoading || state.transportLoading

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onRefresh={handleManualRefresh} refreshing={isRefreshing} />

      {state.settingsOpen && (
        <div className="max-w-lg mx-auto w-full px-4 pt-4">
          <SettingsPanel
            onWeatherRefresh={() => state.location && fetchWeather(state.location)}
            onTransportRefresh={() => state.stop && fetchDepartures(state.stop)}
          />
        </div>
      )}

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/2">
            <WeatherPanel />
          </div>
          <div className="w-full md:w-1/2">
            <TransportPanel />
          </div>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
