import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { AppState, AppAction, SavedLocation, SavedStop, WeatherData, Departure } from '../types'
import { getLocation, getStop } from '../utils/localStorage'

const initialState: AppState = {
  location: getLocation(),
  stop: getStop(),
  weather: null,
  departures: [],
  weatherLoading: false,
  transportLoading: false,
  weatherError: null,
  transportError: null,
  lastUpdated: null,
  settingsOpen: false,
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOCATION':
      return { ...state, location: action.payload }
    case 'SET_STOP':
      return { ...state, stop: action.payload }
    case 'SET_WEATHER':
      return { ...state, weather: action.payload, weatherError: null }
    case 'SET_DEPARTURES':
      return { ...state, departures: action.payload, transportError: null }
    case 'SET_WEATHER_LOADING':
      return { ...state, weatherLoading: action.payload }
    case 'SET_TRANSPORT_LOADING':
      return { ...state, transportLoading: action.payload }
    case 'SET_WEATHER_ERROR':
      return { ...state, weatherError: action.payload }
    case 'SET_TRANSPORT_ERROR':
      return { ...state, transportError: action.payload }
    case 'SET_LAST_UPDATED':
      return { ...state, lastUpdated: action.payload }
    case 'TOGGLE_SETTINGS':
      return { ...state, settingsOpen: !state.settingsOpen }
    case 'CLOSE_SETTINGS':
      return { ...state, settingsOpen: false }
    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  setLocation: (loc: SavedLocation) => void
  setStop: (stop: SavedStop) => void
  setWeather: (data: WeatherData) => void
  setDepartures: (departures: Departure[]) => void
  toggleSettings: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const value: AppContextValue = {
    state,
    dispatch,
    setLocation: (loc) => dispatch({ type: 'SET_LOCATION', payload: loc }),
    setStop: (stop) => dispatch({ type: 'SET_STOP', payload: stop }),
    setWeather: (data) => dispatch({ type: 'SET_WEATHER', payload: data }),
    setDepartures: (departures) => dispatch({ type: 'SET_DEPARTURES', payload: departures }),
    toggleSettings: () => dispatch({ type: 'TOGGLE_SETTINGS' }),
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
