import { getWeatherCodeInfo } from '../../data/weatherCodes'
import type { WeatherData } from '../../types'

interface Props {
  current: WeatherData['current']
}

export function CurrentConditions({ current }: Props) {
  const { label, icon } = getWeatherCodeInfo(current.weatherCode)
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-3">
        <span className="text-6xl font-bold text-gray-800">{current.temperature}°C</span>
        <span className="text-4xl mb-1" title={label}>{icon}</span>
      </div>
      <p className="text-sm text-gray-500">
        Feels like {current.feelsLike}°C
      </p>
      <p className="text-sm text-gray-500">
        Wind {current.windSpeed} km/h
      </p>
    </div>
  )
}
