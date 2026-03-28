import { useState, useEffect } from 'react';
import type { WeatherData } from '../types';
import { useAppContext } from '../context/AppContext';

interface UseWeatherResult {
  data: WeatherData | null;
  loading: boolean;
  error: boolean;
}

interface OpenMeteoResponse {
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

    let cancelled = false;
    setLoading(true);
    setError(false);

    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(location.lat));
    url.searchParams.set('longitude', String(location.lng));
    url.searchParams.set('current', 'temperature_2m,apparent_temperature,wind_speed_10m,weather_code');
    url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min');
    url.searchParams.set('forecast_days', '5');
    url.searchParams.set('models', 'bom_access_global');
    url.searchParams.set('timezone', 'Australia/Sydney');
    url.searchParams.set('wind_speed_unit', 'kmh');

    fetch(url.toString())
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<OpenMeteoResponse>;
      })
      .then(json => {
        if (cancelled) return;
        const mapped: WeatherData = {
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
        setData(mapped);
        setLastUpdated(new Date());
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [location, refreshKey, setLastUpdated]);

  return { data, loading, error };
}
