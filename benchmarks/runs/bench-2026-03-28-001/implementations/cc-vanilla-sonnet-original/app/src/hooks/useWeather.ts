import { useCallback } from 'react'
import type { SavedLocation, WeatherData } from '../types'
import { useAppContext } from '../context/AppContext'

export function useWeather() {
  const { state, dispatch } = useAppContext()

  const fetchWeather = useCallback(async (location: SavedLocation) => {
    dispatch({ type: 'SET_WEATHER_LOADING', payload: true })
    dispatch({ type: 'SET_WEATHER_ERROR', payload: null })

    const params = new URLSearchParams({
      latitude: String(location.lat),
      longitude: String(location.lon),
      current: 'temperature_2m,apparent_temperature,wind_speed_10m,weather_code',
      daily: 'temperature_2m_max,temperature_2m_min,weather_code',
      forecast_days: '5',
      timezone: 'Australia/Sydney',
      models: 'bom_access_global',
    })

    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const json = await response.json()

      const weather: WeatherData = {
        current: {
          temperature: Math.round(json.current.temperature_2m),
          feelsLike: Math.round(json.current.apparent_temperature),
          windSpeed: Math.round(json.current.wind_speed_10m),
          weatherCode: json.current.weather_code,
        },
        daily: (json.daily.time as string[]).map((date: string, i: number) => ({
          date,
          maxTemp: Math.round(json.daily.temperature_2m_max[i]),
          minTemp: Math.round(json.daily.temperature_2m_min[i]),
          weatherCode: json.daily.weather_code[i],
        })),
      }

      dispatch({ type: 'SET_WEATHER', payload: weather })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch weather'
      dispatch({ type: 'SET_WEATHER_ERROR', payload: message })
      return false
    } finally {
      dispatch({ type: 'SET_WEATHER_LOADING', payload: false })
    }
  }, [dispatch])

  return { fetchWeather, weather: state.weather, weatherLoading: state.weatherLoading, weatherError: state.weatherError }
}
