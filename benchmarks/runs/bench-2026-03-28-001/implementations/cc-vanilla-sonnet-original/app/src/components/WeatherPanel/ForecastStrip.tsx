import type { WeatherData } from '../../types'
import { ForecastCard } from './ForecastCard'

interface Props {
  daily: WeatherData['daily']
}

export function ForecastStrip({ daily }: Props) {
  return (
    <div className="flex gap-2 mt-4">
      {daily.map((day) => (
        <ForecastCard
          key={day.date}
          date={day.date}
          maxTemp={day.maxTemp}
          minTemp={day.minTemp}
          weatherCode={day.weatherCode}
        />
      ))}
    </div>
  )
}
