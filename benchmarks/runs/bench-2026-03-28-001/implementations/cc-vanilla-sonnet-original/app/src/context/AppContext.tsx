import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type {
  AppState, Stop, SavedRoute, TripOption, ServiceAdvisory,
  WeatherCurrent, WeatherForecastDay, BehaviorEntry, BehaviorPattern
} from '../types';
import * as storage from '../utils/storage';

export type Action =
  | { type: 'SET_STOPS'; stops: Stop[] }
  | { type: 'ADD_ROUTE'; route: SavedRoute }
  | { type: 'UPDATE_ROUTE'; route: SavedRoute }
  | { type: 'DELETE_ROUTE'; routeId: string }
  | { type: 'SET_ACTIVE_ROUTE'; routeId: string | null }
  | { type: 'SET_TRIP_OPTIONS'; options: TripOption[] }
  | { type: 'SET_ADVISORIES'; advisories: ServiceAdvisory[] }
  | { type: 'SET_WEATHER'; current: WeatherCurrent; forecast: WeatherForecastDay[] }
  | { type: 'SET_LOCATION'; lat: number; lon: number }
  | { type: 'LOG_BEHAVIOR'; entry: BehaviorEntry }
  | { type: 'SET_PATTERNS'; patterns: BehaviorPattern[] }
  | { type: 'SET_REFRESHING'; value: boolean }
  | { type: 'SET_LAST_REFRESHED'; ts: number }
  | { type: 'SET_API_KEY'; key: string };

function initialState(): AppState {
  const apiKey =
    storage.get<string>('api_key') ??
    import.meta.env.VITE_TFNSW_API_KEY ?? '';
  const savedRoutes = storage.get<SavedRoute[]>('routes') ?? [];
  const behaviorLog = storage.get<BehaviorEntry[]>('behavior') ?? [];
  const location = storage.get<{ lat: number; lon: number }>('user_location');

  return {
    stops: [],
    stopsLoaded: false,
    savedRoutes,
    activeRouteId: null,
    tripOptions: [],
    advisories: [],
    weatherCurrent: null,
    weatherForecast: [],
    behaviorLog,
    behaviorPatterns: [],
    userLat: location?.lat ?? null,
    userLon: location?.lon ?? null,
    lastRefreshedAt: null,
    isRefreshing: false,
    apiKey,
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STOPS':
      return { ...state, stops: action.stops, stopsLoaded: true };
    case 'ADD_ROUTE':
      return { ...state, savedRoutes: [...state.savedRoutes, action.route] };
    case 'UPDATE_ROUTE':
      return {
        ...state,
        savedRoutes: state.savedRoutes.map(r => r.id === action.route.id ? action.route : r),
      };
    case 'DELETE_ROUTE':
      return {
        ...state,
        savedRoutes: state.savedRoutes.filter(r => r.id !== action.routeId),
        activeRouteId: state.activeRouteId === action.routeId ? null : state.activeRouteId,
      };
    case 'SET_ACTIVE_ROUTE':
      return { ...state, activeRouteId: action.routeId, tripOptions: [] };
    case 'SET_TRIP_OPTIONS':
      return { ...state, tripOptions: action.options };
    case 'SET_ADVISORIES':
      return { ...state, advisories: action.advisories };
    case 'SET_WEATHER':
      return { ...state, weatherCurrent: action.current, weatherForecast: action.forecast };
    case 'SET_LOCATION':
      return { ...state, userLat: action.lat, userLon: action.lon };
    case 'LOG_BEHAVIOR':
      return { ...state, behaviorLog: [...state.behaviorLog, action.entry] };
    case 'SET_PATTERNS':
      return { ...state, behaviorPatterns: action.patterns };
    case 'SET_REFRESHING':
      return { ...state, isRefreshing: action.value };
    case 'SET_LAST_REFRESHED':
      return { ...state, lastRefreshedAt: action.ts };
    case 'SET_API_KEY':
      return { ...state, apiKey: action.key };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  // Persist routes
  useEffect(() => {
    storage.set('routes', state.savedRoutes);
  }, [state.savedRoutes]);

  // Persist behavior log
  useEffect(() => {
    storage.set('behavior', state.behaviorLog);
  }, [state.behaviorLog]);

  // Persist location
  useEffect(() => {
    if (state.userLat !== null && state.userLon !== null) {
      storage.set('user_location', { lat: state.userLat, lon: state.userLon });
    }
  }, [state.userLat, state.userLon]);

  // Persist API key
  useEffect(() => {
    if (state.apiKey) {
      storage.set('api_key', state.apiKey);
    }
  }, [state.apiKey]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
