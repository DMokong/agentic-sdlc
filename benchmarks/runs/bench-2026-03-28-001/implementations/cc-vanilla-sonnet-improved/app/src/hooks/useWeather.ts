import { useState, useEffect } from 'react';
import type { WeatherData } from '../types';
import { useAppContext } from '../context/AppContext';

interface UseWeatherResult {
  data: WeatherData | null;
  loading: boolean;
  error: boolean;
}

export function useWeather(): UseWeatherResult {
  const { location, refreshKey, setLastUpdated } = useAppContext();
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!location) {
      setData(null);
      setLoading(false);
      setError(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(false);

    const params = new URLSearchParams({
      latitude: String(location.lat),
      longitude: String(location.lng),
      current: 'temperature_2m,apparent_temperature,wind_speed_10m,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min',
      forecast_days: '5',
      models: 'bom_access_global',
      timezone: 'Australia/Sydney',
      wind_speed_unit: 'kmh',
    });

    fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: {
        current: {
          temperature_2m: number;
          apparent_temperature: number;
          wind_speed_10m: number;
          weather_code: number;
        };
        daily: {
          time: string[];
          temperature_2m_max: number[];
          temperature_2m_min: number[];
          weather_code: number[];
        };
      }) => {
        const weather: WeatherData = {
          current: {
            temp: json.current.temperature_2m,
            feelsLike: json.current.apparent_temperature,
            windSpeed: json.current.wind_speed_10m,
            weatherCode: json.current.weather_code,
          },
          daily: json.daily.time.map((date, i) => ({
            date,
            tempMax: json.daily.temperature_2m_max[i],
            tempMin: json.daily.temperature_2m_min[i],
            weatherCode: json.daily.weather_code[i],
          })),
        };
        setData(weather);
        setLastUpdated(new Date());
        setLoading(false);
      })
      .catch(err => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(true);
        setLoading(false);
      });

    return () => controller.abort();
  }, [location, refreshKey, setLastUpdated]);

  return { data, loading, error };
}
