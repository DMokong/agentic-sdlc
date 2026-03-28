import { getDayLabel } from '../../utils/time'
import { getWeatherCodeInfo } from '../../data/weatherCodes'

interface Props {
  date: string
  maxTemp: number
  minTemp: number
  weatherCode: number
}

export function ForecastCard({ date, maxTemp, minTemp, weatherCode }: Props) {
  const { label, icon } = getWeatherCodeInfo(weatherCode)
  return (
    <div className="flex flex-col items-center bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex-1 min-w-0">
      <span className="text-xs font-medium text-gray-500 truncate w-full text-center">
        {getDayLabel(date)}
      </span>
      <span className="text-2xl my-1" title={label}>{icon}</span>
      <span className="text-sm font-semibold text-gray-800">{maxTemp}°</span>
      <span className="text-xs text-gray-400">{minTemp}°</span>
    </div>
  )
}
