export interface WeatherCodeInfo {
  label: string;
  icon: string; // emoji
}

const weatherCodes: Record<number, WeatherCodeInfo> = {
  0:  { label: 'Clear sky',              icon: '☀️' },
  1:  { label: 'Mainly clear',           icon: '🌤️' },
  2:  { label: 'Partly cloudy',          icon: '⛅' },
  3:  { label: 'Overcast',              icon: '☁️' },
  45: { label: 'Foggy',                 icon: '🌫️' },
  48: { label: 'Icy fog',              icon: '🌫️' },
  51: { label: 'Light drizzle',         icon: '🌦️' },
  53: { label: 'Moderate drizzle',      icon: '🌦️' },
  55: { label: 'Dense drizzle',         icon: '🌧️' },
  56: { label: 'Light freezing drizzle',icon: '🌧️' },
  57: { label: 'Heavy freezing drizzle',icon: '🌧️' },
  61: { label: 'Slight rain',           icon: '🌧️' },
  63: { label: 'Moderate rain',         icon: '🌧️' },
  65: { label: 'Heavy rain',            icon: '🌧️' },
  66: { label: 'Freezing rain',         icon: '🌧️' },
  67: { label: 'Heavy freezing rain',   icon: '🌧️' },
  71: { label: 'Slight snow',           icon: '❄️' },
  73: { label: 'Moderate snow',         icon: '❄️' },
  75: { label: 'Heavy snow',            icon: '❄️' },
  77: { label: 'Snow grains',           icon: '🌨️' },
  80: { label: 'Slight rain showers',   icon: '🌦️' },
  81: { label: 'Moderate rain showers', icon: '🌧️' },
  82: { label: 'Violent rain showers',  icon: '⛈️' },
  85: { label: 'Slight snow showers',   icon: '🌨️' },
  86: { label: 'Heavy snow showers',    icon: '🌨️' },
  95: { label: 'Thunderstorm',         icon: '⛈️' },
  96: { label: 'Thunderstorm w/ hail', icon: '⛈️' },
  99: { label: 'Thunderstorm w/ hail', icon: '⛈️' },
};

export function getWeatherInfo(code: number): WeatherCodeInfo {
  return weatherCodes[code] ?? { label: 'Unknown', icon: '❓' };
}

export default weatherCodes;
