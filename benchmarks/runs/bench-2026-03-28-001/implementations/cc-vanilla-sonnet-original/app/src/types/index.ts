export interface SavedLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface SavedStop {
  stopId: string;
  name: string;
  modes: TransportMode[];
}

export type TransportMode = 'bus' | 'train' | 'ferry' | 'lightrail' | 'coach' | 'metro';

export interface WeatherData {
  current: {
    temp: number;
    feelsLike: number;
    windSpeed: number;
    weatherCode: number;
  };
  daily: DailyForecast[];
}

export interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
}

export interface Departure {
  mode: TransportMode;
  routeNumber: string;
  destination: string;
  scheduledDeparture: string;
  estimatedDeparture: string | null;
  isDelayed: boolean;
}
