# Weather + Transport App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vite + React + TypeScript + Tailwind single-page app for NSW commuters showing current weather, 5-day forecast, and TfNSW public transport departures from a user-configured location and stop.

**Architecture:** Single `AppContext` (useReducer) manages all state. Open-Meteo for weather (no auth). TfNSW Trip Planner API for departures (apikey from `VITE_TFNSW_API_KEY`). localStorage for user preferences. Auto-refresh every 5 min. All times in `Australia/Sydney` timezone. No backend.

**Tech Stack:** Vite 5, React 18, TypeScript 5, Tailwind CSS 3.

**Output directory:** `/Users/dustincheng/projects/speculator/benchmarks/weather-transport-app/`

---

## File Map

```
weather-transport-app/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  tsconfig.node.json
  tailwind.config.js
  postcss.config.js
  .env.example
  src/
    main.tsx
    App.tsx
    index.css
    types/index.ts
    utils/time.ts
    utils/localStorage.ts
    data/suburbs.ts
    data/weatherCodes.ts
    context/AppContext.tsx
    components/
      Header.tsx
      shared/
        StalenessWarning.tsx
        LastUpdated.tsx
        OnboardingPrompt.tsx
      WeatherPanel/
        index.tsx
        CurrentConditions.tsx
        ForecastStrip.tsx
        ForecastCard.tsx
        WeatherSkeleton.tsx
        WeatherError.tsx
      TransportPanel/
        index.tsx
        DepartureList.tsx
        DepartureRow.tsx
        TransportSkeleton.tsx
        TransportError.tsx
      SettingsPanel/
        index.tsx
        LocationSearch.tsx
        StopSearch.tsx
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `weather-transport-app/package.json`
- Create: `weather-transport-app/vite.config.ts`
- Create: `weather-transport-app/tsconfig.json`
- Create: `weather-transport-app/tsconfig.node.json`
- Create: `weather-transport-app/tailwind.config.js`
- Create: `weather-transport-app/postcss.config.js`
- Create: `weather-transport-app/index.html`
- Create: `weather-transport-app/.env.example`
- Create: `weather-transport-app/src/index.css`
- Create: `weather-transport-app/src/main.tsx`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "weather-transport-app",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.6.3",
    "vite": "^5.4.11"
  }
}
```

- [ ] **Step 2: Create vite.config.ts**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Create tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 6: Create postcss.config.js**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 7: Create index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Weather + Transport</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create .env.example**

```
VITE_TFNSW_API_KEY=your_api_key_here
```

- [ ] **Step 9: Create src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 10: Create src/main.tsx**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 11: Install dependencies**

```bash
cd /Users/dustincheng/projects/speculator/benchmarks/weather-transport-app
npm install
```

Expected: node_modules created, no errors.

---

## Task 2: Types, Data & Utilities

**Files:**
- Create: `src/types/index.ts`
- Create: `src/utils/time.ts`
- Create: `src/utils/localStorage.ts`
- Create: `src/data/suburbs.ts`
- Create: `src/data/weatherCodes.ts`

- [ ] **Step 1: Create src/types/index.ts**

```ts
export interface SavedLocation {
  name: string;
  lat: number;
  lon: number;
}

export interface SavedStop {
  id: string;
  name: string;
  modes: number[];
}

export interface PanelError {
  kind: 'auth' | 'network' | 'unknown';
  message: string;
}

export interface PanelState<T> {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: T | null;
  error: PanelError | null;
  lastUpdatedAt: number | null;
}

export interface WeatherCurrent {
  temperature_2m: number;
  apparent_temperature: number;
  windspeed_10m: number;
  weathercode: number;
}

export interface WeatherDaily {
  time: string[];
  weathercode: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
}

export interface WeatherData {
  current: WeatherCurrent;
  daily: WeatherDaily;
}

export interface Departure {
  mode: number;
  routeNumber: string;
  destination: string;
  departureTimePlanned: string;
  departureTimeEstimated: string | null;
}

export interface TransportData {
  departures: Departure[];
}

export interface AppState {
  location: SavedLocation | null;
  stop: SavedStop | null;
  weather: PanelState<WeatherData>;
  transport: PanelState<TransportData>;
  settingsOpen: boolean;
}
```

- [ ] **Step 2: Create src/utils/time.ts**

```ts
const SYD_TZ = 'Australia/Sydney';

export function formatTime(isoString: string): string {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: SYD_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(isoString));
}

export function getDayLabel(isoDate: string): string {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: SYD_TZ,
    weekday: 'short',
  }).format(new Date(isoDate));
}

export function getGreeting(): string {
  const hour = parseInt(
    new Intl.DateTimeFormat('en-AU', {
      timeZone: SYD_TZ,
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
    10
  );
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

export function formatUpdatedTime(timestamp: number): string {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: SYD_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestamp));
}
```

- [ ] **Step 3: Create src/utils/localStorage.ts**

```ts
import type { SavedLocation, SavedStop } from '../types';

export function loadLocation(): SavedLocation | null {
  try {
    const raw = localStorage.getItem('wt_location');
    if (!raw) return null;
    return JSON.parse(raw) as SavedLocation;
  } catch {
    localStorage.removeItem('wt_location');
    return null;
  }
}

export function saveLocation(location: SavedLocation): void {
  localStorage.setItem('wt_location', JSON.stringify(location));
}

export function loadStop(): SavedStop | null {
  try {
    const raw = localStorage.getItem('wt_stop');
    if (!raw) return null;
    return JSON.parse(raw) as SavedStop;
  } catch {
    localStorage.removeItem('wt_stop');
    return null;
  }
}

export function saveStop(stop: SavedStop): void {
  localStorage.setItem('wt_stop', JSON.stringify(stop));
}
```

- [ ] **Step 4: Create src/data/suburbs.ts**

```ts
export interface Suburb {
  name: string;
  lat: number;
  lon: number;
}

export const NSW_SUBURBS: Suburb[] = [
  { name: 'Sydney CBD', lat: -33.8688, lon: 151.2093 },
  { name: 'Bondi', lat: -33.8915, lon: 151.2767 },
  { name: 'Bondi Beach', lat: -33.8908, lon: 151.2743 },
  { name: 'Manly', lat: -33.7969, lon: 151.2859 },
  { name: 'Parramatta', lat: -33.8148, lon: 151.0017 },
  { name: 'Chatswood', lat: -33.7975, lon: 151.1812 },
  { name: 'Newtown', lat: -33.8978, lon: 151.1793 },
  { name: 'Surry Hills', lat: -33.8878, lon: 151.2112 },
  { name: 'Glebe', lat: -33.8799, lon: 151.1848 },
  { name: 'Randwick', lat: -33.9145, lon: 151.2390 },
  { name: 'Coogee', lat: -33.9207, lon: 151.2571 },
  { name: 'Cronulla', lat: -34.0524, lon: 151.1517 },
  { name: 'Hurstville', lat: -33.9671, lon: 151.1033 },
  { name: 'Bankstown', lat: -33.9175, lon: 151.0354 },
  { name: 'Liverpool', lat: -33.9191, lon: 150.9238 },
  { name: 'Penrith', lat: -33.7513, lon: 150.6942 },
  { name: 'Blacktown', lat: -33.7701, lon: 150.9055 },
  { name: 'Castle Hill', lat: -33.7297, lon: 151.0040 },
  { name: 'Hornsby', lat: -33.7030, lon: 151.0994 },
  { name: 'Gosford', lat: -33.4239, lon: 151.3418 },
  { name: 'Newcastle', lat: -32.9267, lon: 151.7789 },
  { name: 'Wollongong', lat: -34.4278, lon: 150.8931 },
  { name: 'Campbelltown', lat: -34.0645, lon: 150.8151 },
  { name: 'Sutherland', lat: -34.0303, lon: 151.0590 },
  { name: 'Miranda', lat: -34.0344, lon: 151.1012 },
  { name: 'Kogarah', lat: -33.9637, lon: 151.1330 },
  { name: 'Ashfield', lat: -33.8890, lon: 151.1253 },
  { name: 'Strathfield', lat: -33.8738, lon: 151.0830 },
  { name: 'Auburn', lat: -33.8490, lon: 151.0329 },
  { name: 'Granville', lat: -33.8332, lon: 150.9987 },
  { name: 'Ryde', lat: -33.8167, lon: 151.1000 },
  { name: 'Epping', lat: -33.7722, lon: 151.0812 },
  { name: 'Burwood', lat: -33.8774, lon: 151.1039 },
  { name: 'Concord', lat: -33.8652, lon: 151.0966 },
  { name: 'Drummoyne', lat: -33.8500, lon: 151.1500 },
  { name: 'Leichhardt', lat: -33.8831, lon: 151.1564 },
  { name: 'Marrickville', lat: -33.9082, lon: 151.1568 },
  { name: 'Rockdale', lat: -33.9500, lon: 151.1333 },
  { name: 'Maroubra', lat: -33.9386, lon: 151.2342 },
  { name: 'Kingsford', lat: -33.9184, lon: 151.2261 },
  { name: 'Mascot', lat: -33.9315, lon: 151.1958 },
  { name: 'Waterloo', lat: -33.8980, lon: 151.2074 },
  { name: 'Redfern', lat: -33.8929, lon: 151.2033 },
  { name: 'Pyrmont', lat: -33.8724, lon: 151.1935 },
  { name: 'Balmain', lat: -33.8589, lon: 151.1785 },
  { name: 'Mosman', lat: -33.8269, lon: 151.2451 },
  { name: 'Neutral Bay', lat: -33.8303, lon: 151.2134 },
  { name: 'North Sydney', lat: -33.8399, lon: 151.2071 },
  { name: 'Dee Why', lat: -33.7496, lon: 151.2880 },
  { name: 'Brookvale', lat: -33.7583, lon: 151.2627 },
];
```

- [ ] **Step 5: Create src/data/weatherCodes.ts**

```ts
interface WeatherCodeInfo {
  label: string;
  icon: string;
}

const WEATHER_CODES: Record<number, WeatherCodeInfo> = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Foggy', icon: '🌫️' },
  48: { label: 'Icy fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Moderate drizzle', icon: '🌦️' },
  55: { label: 'Dense drizzle', icon: '🌧️' },
  56: { label: 'Freezing drizzle', icon: '🌧️' },
  57: { label: 'Heavy freezing drizzle', icon: '🌧️' },
  61: { label: 'Slight rain', icon: '🌧️' },
  63: { label: 'Moderate rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  66: { label: 'Freezing rain', icon: '🌨️' },
  67: { label: 'Heavy freezing rain', icon: '🌨️' },
  71: { label: 'Slight snow', icon: '❄️' },
  73: { label: 'Moderate snow', icon: '❄️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  77: { label: 'Snow grains', icon: '🌨️' },
  80: { label: 'Slight showers', icon: '🌦️' },
  81: { label: 'Moderate showers', icon: '🌧️' },
  82: { label: 'Violent showers', icon: '⛈️' },
  85: { label: 'Slight snow showers', icon: '🌨️' },
  86: { label: 'Heavy snow showers', icon: '🌨️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm with hail', icon: '⛈️' },
  99: { label: 'Heavy thunderstorm with hail', icon: '⛈️' },
};

export function getWeatherInfo(code: number): WeatherCodeInfo {
  return WEATHER_CODES[code] ?? { label: 'Unknown', icon: '🌡️' };
}
```

---

## Task 3: App Context

**Files:**
- Create: `src/context/AppContext.tsx`

- [ ] **Step 1: Create src/context/AppContext.tsx**

```tsx
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  AppState,
  SavedLocation,
  SavedStop,
  WeatherData,
  TransportData,
  PanelError,
} from '../types';
import { loadLocation, saveLocation, loadStop, saveStop } from '../utils/localStorage';

// ─── Actions ────────────────────────────────────────────────────────────────

type AppAction =
  | { type: 'SET_LOCATION'; payload: SavedLocation }
  | { type: 'SET_STOP'; payload: SavedStop }
  | { type: 'WEATHER_LOADING' }
  | { type: 'WEATHER_SUCCESS'; payload: WeatherData }
  | { type: 'WEATHER_ERROR'; payload: PanelError }
  | { type: 'TRANSPORT_LOADING' }
  | { type: 'TRANSPORT_SUCCESS'; payload: TransportData }
  | { type: 'TRANSPORT_ERROR'; payload: PanelError }
  | { type: 'OPEN_SETTINGS' }
  | { type: 'CLOSE_SETTINGS' };

// ─── Initial State ───────────────────────────────────────────────────────────

const initialState: AppState = {
  location: loadLocation(),
  stop: loadStop(),
  weather: { status: 'idle', data: null, error: null, lastUpdatedAt: null },
  transport: { status: 'idle', data: null, error: null, lastUpdatedAt: null },
  settingsOpen: false,
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOCATION':
      return { ...state, location: action.payload };
    case 'SET_STOP':
      return { ...state, stop: action.payload };
    case 'WEATHER_LOADING':
      return { ...state, weather: { ...state.weather, status: 'loading', error: null } };
    case 'WEATHER_SUCCESS':
      return {
        ...state,
        weather: { status: 'success', data: action.payload, error: null, lastUpdatedAt: Date.now() },
      };
    case 'WEATHER_ERROR':
      return { ...state, weather: { ...state.weather, status: 'error', error: action.payload } };
    case 'TRANSPORT_LOADING':
      return { ...state, transport: { ...state.transport, status: 'loading', error: null } };
    case 'TRANSPORT_SUCCESS':
      return {
        ...state,
        transport: { status: 'success', data: action.payload, error: null, lastUpdatedAt: Date.now() },
      };
    case 'TRANSPORT_ERROR':
      return { ...state, transport: { ...state.transport, status: 'error', error: action.payload } };
    case 'OPEN_SETTINGS':
      return { ...state, settingsOpen: true };
    case 'CLOSE_SETTINGS':
      return { ...state, settingsOpen: false };
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  setLocation: (loc: SavedLocation) => void;
  setStop: (stop: SavedStop) => void;
  openSettings: () => void;
  closeSettings: () => void;
  refresh: () => void;
  retryWeather: () => void;
  retryTransport: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── API fetch helpers ────────────────────────────────────────────────────────

async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('current', 'temperature_2m,apparent_temperature,windspeed_10m,weathercode');
  url.searchParams.set('daily', 'weathercode,temperature_2m_max,temperature_2m_min');
  url.searchParams.set('forecast_days', '5');
  url.searchParams.set('timezone', 'Australia/Sydney');
  url.searchParams.set('models', 'bom_access_global');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<WeatherData>;
}

async function fetchTransportData(stopId: string): Promise<TransportData> {
  const apiKey = import.meta.env.VITE_TFNSW_API_KEY as string | undefined;
  if (!apiKey) {
    throw Object.assign(new Error('API key not configured'), { kind: 'auth' as const });
  }

  const url = new URL('https://api.transport.nsw.gov.au/v1/tp/departure_mon');
  url.searchParams.set('outputFormat', 'rapidJSON');
  url.searchParams.set('coordOutputFormat', 'EPSG:4326');
  url.searchParams.set('mode', 'direct');
  url.searchParams.set('type_dm', 'stop');
  url.searchParams.set('name_dm', stopId);
  url.searchParams.set('departureMonitorMacro', 'true');
  url.searchParams.set('TfNSWDM', 'true');
  url.searchParams.set('version', '10.2.1.42');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `apikey ${apiKey}` },
  });

  if (res.status === 401 || res.status === 403) {
    throw Object.assign(new Error('Unauthorized'), { kind: 'auth' as const });
  }
  if (!res.ok) {
    throw Object.assign(new Error(`HTTP ${res.status}`), { kind: 'network' as const });
  }

  interface TfNSWResponse {
    stopEvents?: Array<{
      transportation?: {
        product?: { class?: number };
        number?: string;
        destination?: { name?: string };
      };
      departureTimePlanned?: string;
      departureTimeEstimated?: string;
    }>;
  }
  const json = (await res.json()) as TfNSWResponse;
  const events = json.stopEvents ?? [];

  const departures = events.slice(0, 5).map((e) => ({
    mode: e.transportation?.product?.class ?? 0,
    routeNumber: e.transportation?.number ?? '',
    destination: e.transportation?.destination?.name ?? '',
    departureTimePlanned: e.departureTimePlanned ?? '',
    departureTimeEstimated: e.departureTimeEstimated ?? null,
  }));

  return { departures };
}

// ─── Provider ────────────────────────────────────────────────────────────────

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const weatherInflightRef = useRef(false);
  const transportInflightRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doWeatherFetch = useCallback(async (lat: number, lon: number) => {
    if (weatherInflightRef.current) return;
    weatherInflightRef.current = true;
    dispatch({ type: 'WEATHER_LOADING' });
    try {
      const data = await fetchWeatherData(lat, lon);
      dispatch({ type: 'WEATHER_SUCCESS', payload: data });
    } catch (err) {
      dispatch({
        type: 'WEATHER_ERROR',
        payload: { kind: 'network', message: String(err) },
      });
    } finally {
      weatherInflightRef.current = false;
    }
  }, []);

  const doTransportFetch = useCallback(async (stopId: string) => {
    if (transportInflightRef.current) return;
    transportInflightRef.current = true;
    dispatch({ type: 'TRANSPORT_LOADING' });
    try {
      const data = await fetchTransportData(stopId);
      dispatch({ type: 'TRANSPORT_SUCCESS', payload: data });
    } catch (err) {
      const kind =
        (err as { kind?: string }).kind === 'auth' ? 'auth' : 'network';
      dispatch({
        type: 'TRANSPORT_ERROR',
        payload: { kind, message: String(err) },
      });
    } finally {
      transportInflightRef.current = false;
    }
  }, []);

  const doRefresh = useCallback(
    (loc: AppState['location'], stp: AppState['stop']) => {
      if (loc) doWeatherFetch(loc.lat, loc.lon);
      if (stp) doTransportFetch(stp.id);
    },
    [doWeatherFetch, doTransportFetch]
  );

  const startInterval = useCallback(
    (loc: AppState['location'], stp: AppState['stop']) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => doRefresh(loc, stp), REFRESH_INTERVAL_MS);
    },
    [doRefresh]
  );

  // Initial fetch on mount / when location or stop changes
  useEffect(() => {
    if (state.location) doWeatherFetch(state.location.lat, state.location.lon);
  }, [state.location, doWeatherFetch]);

  useEffect(() => {
    if (state.stop) doTransportFetch(state.stop.id);
  }, [state.stop, doTransportFetch]);

  // Auto-refresh interval
  useEffect(() => {
    if (!state.location && !state.stop) return;
    startInterval(state.location, state.stop);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.location, state.stop, startInterval]);

  const refresh = useCallback(() => {
    doRefresh(state.location, state.stop);
    startInterval(state.location, state.stop);
  }, [state.location, state.stop, doRefresh, startInterval]);

  const setLocation = useCallback((loc: SavedLocation) => {
    saveLocation(loc);
    dispatch({ type: 'SET_LOCATION', payload: loc });
  }, []);

  const setStop = useCallback((stop: SavedStop) => {
    saveStop(stop);
    dispatch({ type: 'SET_STOP', payload: stop });
  }, []);

  const retryWeather = useCallback(() => {
    if (state.location) doWeatherFetch(state.location.lat, state.location.lon);
  }, [state.location, doWeatherFetch]);

  const retryTransport = useCallback(() => {
    if (state.stop) doTransportFetch(state.stop.id);
  }, [state.stop, doTransportFetch]);

  return (
    <AppContext.Provider
      value={{
        state,
        setLocation,
        setStop,
        openSettings: () => dispatch({ type: 'OPEN_SETTINGS' }),
        closeSettings: () => dispatch({ type: 'CLOSE_SETTINGS' }),
        refresh,
        retryWeather,
        retryTransport,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
```

---

## Task 4: Shared Components

**Files:**
- Create: `src/components/shared/StalenessWarning.tsx`
- Create: `src/components/shared/LastUpdated.tsx`
- Create: `src/components/shared/OnboardingPrompt.tsx`

- [ ] **Step 1: Create StalenessWarning.tsx**

```tsx
import { useEffect, useState } from 'react';

const STALE_MS = 10 * 60 * 1000;

interface Props {
  lastUpdatedAt: number | null;
}

export function StalenessWarning({ lastUpdatedAt }: Props) {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    function check() {
      setStale(!!lastUpdatedAt && Date.now() - lastUpdatedAt > STALE_MS);
    }
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [lastUpdatedAt]);

  if (!stale) return null;
  return (
    <div
      role="alert"
      className="mb-2 rounded bg-yellow-100 px-3 py-2 text-sm font-medium text-yellow-800 border border-yellow-300"
    >
      Data may be out of date.
    </div>
  );
}
```

- [ ] **Step 2: Create LastUpdated.tsx**

```tsx
import { formatUpdatedTime } from '../../utils/time';

interface Props {
  lastUpdatedAt: number | null;
}

export function LastUpdated({ lastUpdatedAt }: Props) {
  if (!lastUpdatedAt) return null;
  return (
    <p className="mt-3 text-xs text-gray-400">
      Updated {formatUpdatedTime(lastUpdatedAt)}
    </p>
  );
}
```

- [ ] **Step 3: Create OnboardingPrompt.tsx**

```tsx
import { useApp } from '../../context/AppContext';

export function OnboardingPrompt() {
  const { openSettings } = useApp();
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="text-5xl mb-4" role="img" aria-label="map">🗺️</div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Set up your commute
      </h2>
      <p className="text-gray-500 mb-6">
        Open Settings to choose a location and transport stop.
      </p>
      <button
        onClick={openSettings}
        className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Open Settings
      </button>
    </div>
  );
}
```

---

## Task 5: Weather Panel

**Files:**
- Create: `src/components/WeatherPanel/WeatherSkeleton.tsx`
- Create: `src/components/WeatherPanel/WeatherError.tsx`
- Create: `src/components/WeatherPanel/ForecastCard.tsx`
- Create: `src/components/WeatherPanel/ForecastStrip.tsx`
- Create: `src/components/WeatherPanel/CurrentConditions.tsx`
- Create: `src/components/WeatherPanel/index.tsx`

- [ ] **Step 1: Create WeatherSkeleton.tsx**

```tsx
export function WeatherSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading weather">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-gray-200 rounded-full" />
        <div className="space-y-2">
          <div className="h-10 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-28" />
      <div className="flex gap-2 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-1 h-24 bg-gray-200 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create WeatherError.tsx**

```tsx
interface Props {
  onRetry: () => void;
}

export function WeatherError({ onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center" role="alert">
      <div className="text-4xl mb-3" role="img" aria-label="warning">⚠️</div>
      <p className="text-gray-600 mb-4">Weather unavailable — tap to retry</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-blue-600 px-5 py-2 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Retry
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create ForecastCard.tsx**

```tsx
import { getDayLabel } from '../../utils/time';
import { getWeatherInfo } from '../../data/weatherCodes';

interface Props {
  isoDate: string;
  weathercode: number;
  high: number;
  low: number;
}

export function ForecastCard({ isoDate, weathercode, high, low }: Props) {
  const { label, icon } = getWeatherInfo(weathercode);
  return (
    <div className="flex flex-col items-center bg-blue-50 rounded-lg p-2 flex-1 min-w-0">
      <span className="text-xs font-medium text-gray-600">{getDayLabel(isoDate)}</span>
      <span
        className="my-1 text-2xl leading-none"
        role="img"
        aria-label={label}
      >
        {icon}
      </span>
      <span className="text-sm font-bold text-gray-800">{Math.round(high)}°</span>
      <span className="text-xs text-gray-500">{Math.round(low)}°</span>
    </div>
  );
}
```

- [ ] **Step 4: Create ForecastStrip.tsx**

```tsx
import { ForecastCard } from './ForecastCard';
import type { WeatherDaily } from '../../types';

interface Props {
  daily: WeatherDaily;
}

export function ForecastStrip({ daily }: Props) {
  return (
    <div className="flex gap-2 mt-4">
      {daily.time.slice(0, 5).map((date, i) => (
        <ForecastCard
          key={date}
          isoDate={date}
          weathercode={daily.weathercode[i]}
          high={daily.temperature_2m_max[i]}
          low={daily.temperature_2m_min[i]}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Create CurrentConditions.tsx**

```tsx
import { getWeatherInfo } from '../../data/weatherCodes';
import type { WeatherCurrent } from '../../types';

interface Props {
  current: WeatherCurrent;
}

export function CurrentConditions({ current }: Props) {
  const { label, icon } = getWeatherInfo(current.weathercode);
  return (
    <div>
      <div className="flex items-center gap-3">
        <span
          className="text-5xl leading-none"
          role="img"
          aria-label={label}
        >
          {icon}
        </span>
        <div>
          <div className="text-5xl font-bold text-gray-900">
            {Math.round(current.temperature_2m)}°C
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Feels like {Math.round(current.apparent_temperature)}°C
          </div>
        </div>
      </div>
      <div className="mt-3 text-sm text-gray-600">
        <span className="font-medium">Wind:</span>{' '}
        {Math.round(current.windspeed_10m)} km/h
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create WeatherPanel/index.tsx**

```tsx
import { useApp } from '../../context/AppContext';
import { WeatherSkeleton } from './WeatherSkeleton';
import { WeatherError } from './WeatherError';
import { CurrentConditions } from './CurrentConditions';
import { ForecastStrip } from './ForecastStrip';
import { StalenessWarning } from '../shared/StalenessWarning';
import { LastUpdated } from '../shared/LastUpdated';

export function WeatherPanel() {
  const { state, retryWeather } = useApp();
  const { weather } = state;

  return (
    <section className="bg-white rounded-2xl shadow p-5 flex-1 min-w-0">
      <h2 className="text-lg font-semibold text-gray-700 mb-3">Weather</h2>
      <StalenessWarning lastUpdatedAt={weather.lastUpdatedAt} />

      {weather.status === 'loading' && <WeatherSkeleton />}

      {weather.status === 'error' && (
        <WeatherError onRetry={retryWeather} />
      )}

      {weather.status === 'success' && weather.data && (
        <>
          <CurrentConditions current={weather.data.current} />
          <ForecastStrip daily={weather.data.daily} />
        </>
      )}

      <LastUpdated lastUpdatedAt={weather.lastUpdatedAt} />
    </section>
  );
}
```

---

## Task 6: Transport Panel

**Files:**
- Create: `src/components/TransportPanel/TransportSkeleton.tsx`
- Create: `src/components/TransportPanel/TransportError.tsx`
- Create: `src/components/TransportPanel/DepartureRow.tsx`
- Create: `src/components/TransportPanel/DepartureList.tsx`
- Create: `src/components/TransportPanel/index.tsx`

- [ ] **Step 1: Create TransportSkeleton.tsx**

```tsx
export function TransportSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-busy="true" aria-label="Loading departures">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <div className="h-8 w-8 bg-gray-200 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-14 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create TransportError.tsx**

```tsx
interface Props {
  kind: 'auth' | 'network' | 'unknown';
  onRetry?: () => void;
}

export function TransportError({ kind, onRetry }: Props) {
  if (kind === 'auth') {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 text-center"
        role="alert"
      >
        <div className="text-4xl mb-3" role="img" aria-label="key">🔑</div>
        <p className="text-gray-600 text-sm">
          API key not configured or invalid — check Settings
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center py-8 text-center"
      role="alert"
    >
      <div className="text-4xl mb-3" role="img" aria-label="warning">⚠️</div>
      <p className="text-gray-600 mb-4 text-sm">
        Couldn&apos;t load departures. Please try again.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-blue-600 px-5 py-2 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Retry
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create DepartureRow.tsx**

```tsx
import { formatTime } from '../../utils/time';
import type { Departure } from '../../types';

const MODE_LABELS: Record<number, string> = {
  1: 'Train',
  4: 'Light Rail',
  5: 'Bus',
  9: 'Ferry',
  11: 'Coach',
};

const MODE_ICONS: Record<number, string> = {
  1: '🚆',
  4: '🚊',
  5: '🚌',
  9: '⛴️',
  11: '🚌',
};

function isDelayed(planned: string, estimated: string | null): boolean {
  if (!estimated) return false;
  return new Date(estimated) > new Date(planned);
}

interface Props {
  departure: Departure;
}

export function DepartureRow({ departure }: Props) {
  const { mode, routeNumber, destination, departureTimePlanned, departureTimeEstimated } = departure;
  const delayed = isDelayed(departureTimePlanned, departureTimeEstimated);
  const modeLabel = MODE_LABELS[mode] ?? 'Transit';
  const modeIcon = MODE_ICONS[mode] ?? '🚌';

  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
      <span
        role="img"
        aria-label={modeLabel}
        className="text-xl w-8 text-center flex-shrink-0 leading-none"
      >
        {modeIcon}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {routeNumber && (
            <span className="text-xs font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded flex-shrink-0">
              {routeNumber}
            </span>
          )}
          <span className="text-sm text-gray-800 truncate">{destination}</span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5">{modeLabel}</div>
      </div>

      <div className="flex flex-col items-end flex-shrink-0">
        <span className="text-sm font-medium text-gray-800">
          {departureTimePlanned ? formatTime(departureTimePlanned) : '—'}
        </span>
        {delayed ? (
          <span
            className="text-xs font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded mt-0.5"
            aria-label="Delayed"
          >
            Delayed{departureTimeEstimated ? ` ${formatTime(departureTimeEstimated)}` : ''}
          </span>
        ) : (
          <span
            className="text-xs font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded mt-0.5"
            aria-label="On time"
          >
            On time
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create DepartureList.tsx**

```tsx
import { DepartureRow } from './DepartureRow';
import type { TransportData } from '../../types';

interface Props {
  data: TransportData;
}

export function DepartureList({ data }: Props) {
  if (data.departures.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8 text-sm">
        No upcoming departures
      </p>
    );
  }

  return (
    <div>
      {data.departures.map((dep, i) => (
        <DepartureRow key={`${dep.departureTimePlanned}-${i}`} departure={dep} />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Create TransportPanel/index.tsx**

```tsx
import { useApp } from '../../context/AppContext';
import { TransportSkeleton } from './TransportSkeleton';
import { TransportError } from './TransportError';
import { DepartureList } from './DepartureList';
import { StalenessWarning } from '../shared/StalenessWarning';
import { LastUpdated } from '../shared/LastUpdated';

export function TransportPanel() {
  const { state, retryTransport } = useApp();
  const { transport, stop } = state;

  return (
    <section className="bg-white rounded-2xl shadow p-5 flex-1 min-w-0">
      <h2 className="text-lg font-semibold text-gray-700 mb-1">Departures</h2>
      {stop && (
        <p className="text-xs text-gray-400 mb-3">{stop.name}</p>
      )}
      <StalenessWarning lastUpdatedAt={transport.lastUpdatedAt} />

      {transport.status === 'loading' && <TransportSkeleton />}

      {transport.status === 'error' && transport.error && (
        <TransportError
          kind={transport.error.kind}
          onRetry={transport.error.kind !== 'auth' ? retryTransport : undefined}
        />
      )}

      {transport.status === 'success' && transport.data && (
        <DepartureList data={transport.data} />
      )}

      <LastUpdated lastUpdatedAt={transport.lastUpdatedAt} />
    </section>
  );
}
```

---

## Task 7: Settings Panel

**Files:**
- Create: `src/components/SettingsPanel/LocationSearch.tsx`
- Create: `src/components/SettingsPanel/StopSearch.tsx`
- Create: `src/components/SettingsPanel/index.tsx`

- [ ] **Step 1: Create LocationSearch.tsx**

```tsx
import { useState } from 'react';
import { NSW_SUBURBS, type Suburb } from '../../data/suburbs';
import { useApp } from '../../context/AppContext';

export function LocationSearch() {
  const { state, setLocation } = useApp();
  const [query, setQuery] = useState('');

  const filtered =
    query.length >= 2
      ? NSW_SUBURBS.filter((s) =>
          s.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10)
      : [];

  function selectSuburb(suburb: Suburb) {
    setLocation({ name: suburb.name, lat: suburb.lat, lon: suburb.lon });
    setQuery('');
  }

  return (
    <div>
      <label
        htmlFor="location-search"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Location
      </label>
      {state.location && (
        <p className="text-xs text-blue-600 mb-1">Current: {state.location.name}</p>
      )}
      <input
        id="location-search"
        type="text"
        placeholder="Type suburb name…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {filtered.length > 0 && (
        <ul className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          {filtered.map((suburb) => (
            <li key={suburb.name}>
              <button
                onClick={() => selectSuburb(suburb)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
              >
                {suburb.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create StopSearch.tsx**

```tsx
import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

interface TfNSWStop {
  id: string;
  name: string;
  productClasses: number[];
}

async function searchStops(query: string, signal: AbortSignal): Promise<TfNSWStop[]> {
  const apiKey = import.meta.env.VITE_TFNSW_API_KEY as string | undefined;
  if (!apiKey) return [];

  const url = new URL('https://api.transport.nsw.gov.au/v1/tp/stop_finder');
  url.searchParams.set('outputFormat', 'rapidJSON');
  url.searchParams.set('type_sf', 'any');
  url.searchParams.set('name_sf', query);
  url.searchParams.set('coordOutputFormat', 'EPSG:4326');
  url.searchParams.set('TfNSWSF', 'true');
  url.searchParams.set('version', '10.2.1.42');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `apikey ${apiKey}` },
    signal,
  });
  if (!res.ok) return [];

  interface StopFinderResponse {
    locations?: Array<{
      id?: string;
      name?: string;
      productClasses?: number[];
    }>;
  }
  const json = (await res.json()) as StopFinderResponse;
  return (json.locations ?? [])
    .filter((loc): loc is { id: string; name: string; productClasses?: number[] } =>
      typeof loc.id === 'string' && typeof loc.name === 'string'
    )
    .map((loc) => ({
      id: loc.id,
      name: loc.name,
      productClasses: loc.productClasses ?? [],
    }))
    .slice(0, 10);
}

export function StopSearch() {
  const { state, setStop } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TfNSWStop[]>([]);
  const [searching, setSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      setSearching(true);
      try {
        const stops = await searchStops(query, abortRef.current.signal);
        setResults(stops);
      } catch {
        // Aborted or network error — silently ignore
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  function selectStop(stop: TfNSWStop) {
    setStop({ id: stop.id, name: stop.name, modes: stop.productClasses });
    setQuery('');
    setResults([]);
  }

  return (
    <div>
      <label
        htmlFor="stop-search"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Transport Stop
      </label>
      {state.stop && (
        <p className="text-xs text-blue-600 mb-1">Current: {state.stop.name}</p>
      )}
      <input
        id="stop-search"
        type="text"
        placeholder="Type stop name…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {searching && (
        <p className="text-xs text-gray-400 mt-1">Searching…</p>
      )}
      {results.length > 0 && (
        <ul className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          {results.map((stop) => (
            <li key={stop.id}>
              <button
                onClick={() => selectStop(stop)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
              >
                {stop.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create SettingsPanel/index.tsx**

```tsx
import { useApp } from '../../context/AppContext';
import { LocationSearch } from './LocationSearch';
import { StopSearch } from './StopSearch';

export function SettingsPanel() {
  const { state, closeSettings } = useApp();

  if (!state.settingsOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={closeSettings}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="Settings"
        aria-modal="true"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
          <button
            onClick={closeSettings}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
            aria-label="Close settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          <LocationSearch />
          <StopSearch />
        </div>

        <div className="px-5 py-4 border-t border-gray-200">
          <button
            onClick={closeSettings}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
```

---

## Task 8: Header & App Assembly

**Files:**
- Create: `src/components/Header.tsx`
- Create: `src/App.tsx`

- [ ] **Step 1: Create Header.tsx**

```tsx
import { useApp } from '../context/AppContext';
import { getGreeting } from '../utils/time';

export function Header() {
  const { openSettings, refresh } = useApp();

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white shadow-sm sticky top-0 z-10">
      <h1 className="text-lg font-semibold text-gray-800">{getGreeting()}</h1>
      <div className="flex items-center gap-2">
        <button
          onClick={refresh}
          aria-label="Refresh"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          onClick={openSettings}
          aria-label="Settings"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create App.tsx**

```tsx
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { WeatherPanel } from './components/WeatherPanel';
import { TransportPanel } from './components/TransportPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { OnboardingPrompt } from './components/shared/OnboardingPrompt';

function AppInner() {
  const { state } = useApp();
  const hasConfig = Boolean(state.location && state.stop);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <main className="flex-1 p-4">
        {!hasConfig ? (
          <OnboardingPrompt />
        ) : (
          <div className="flex flex-col md:flex-row gap-4">
            <WeatherPanel />
            <TransportPanel />
          </div>
        )}
      </main>
      <SettingsPanel />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
```

---

## Task 9: TypeScript Fix & Build Verification

- [ ] **Step 1: Run TypeScript check**

```bash
cd /Users/dustincheng/projects/speculator/benchmarks/weather-transport-app
npx tsc --noEmit
```

Expected: no errors. If errors appear, fix them (common issues: missing `React` import in older configs, strict null checks, unused variables).

- [ ] **Step 2: Start dev server and verify**

```bash
npm run dev
```

Expected: server starts at http://localhost:5173.

Open browser:
1. Should show greeting ("Good morning/afternoon/evening/night") in header
2. Should show onboarding prompt with "Set up your commute"
3. Click Settings → type "Bondi" → see results, select one
4. Type a stop name → see debounced search results after 300ms
5. Select a stop → click Done
6. Both panels appear, weather loads from Open-Meteo

- [ ] **Step 3: Verify localStorage**

Open DevTools → Application → Local Storage:
- `wt_location`: `{"name":"...","lat":...,"lon":...}`
- `wt_stop`: `{"id":"...","name":"...","modes":[...]}`

- [ ] **Step 4: Verify responsive layout**

At 375px width: panels stack vertically.
At 1024px: panels side-by-side.

- [ ] **Step 5: Build**

```bash
npm run build
```

Expected: `dist/` created, no errors.

---

## Spec Coverage Checklist

| Req | Component | Notes |
|-----|-----------|-------|
| R01 – Current temp °C | CurrentConditions | `temperature_2m` + "°C" |
| R02 – 5-day forecast | ForecastStrip + ForecastCard | day label, high, low, icon |
| R03 – Feels like | CurrentConditions | `apparent_temperature` |
| R04 – Wind speed km/h | CurrentConditions | `windspeed_10m` |
| R05 – Next 5 departures | DepartureRow | mode, route, dest, time |
| R06 – On-time/delayed | DepartureRow | green/amber badges |
| R07 – Mode icons | DepartureRow | emoji per product class |
| R08 – Location localStorage | AppContext + localStorage.ts | `wt_location` |
| R09 – Stop localStorage | AppContext + localStorage.ts | `wt_stop` |
| R10 – Greeting | Header + time.ts | `getGreeting()` Sydney TZ |
| R11 – Location search | LocationSearch | bundled suburb list, 2+ chars |
| R12 – Stop search debounced | StopSearch | 300ms, AbortController |
| R13 – Responsive layout | App.tsx | `flex-col md:flex-row` |
| R14 – Auto-refresh + manual | AppContext | 5min setInterval, refresh() |
| R15 – Last updated | LastUpdated | formatUpdatedTime() |
| R16 – Loading skeletons | WeatherSkeleton, TransportSkeleton | independent loading |
| R17 – Weather error retry | WeatherError | "Weather unavailable — tap to retry" |
| R18 – Transport auth error | TransportError kind=auth | distinct message + no retry |
| R19 – Transport general error | TransportError kind=network | retry button |
| R20 – Onboarding | OnboardingPrompt | no location+stop = show prompt |
| R21 – Staleness >10min | StalenessWarning | 30s poll, yellow banner |
| R22 – Sydney timezone | time.ts | all Intl.DateTimeFormat with SYD_TZ |
| R23 – A11y contrast | DepartureRow | green-700/100, amber-700/100 WCAG AA |
