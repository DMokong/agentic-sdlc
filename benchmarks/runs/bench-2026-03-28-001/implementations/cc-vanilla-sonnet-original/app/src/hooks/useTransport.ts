import { useCallback } from 'react'
import type { SavedStop, Departure } from '../types'
import { useAppContext } from '../context/AppContext'

const BASE_URL = 'https://api.transport.nsw.gov.au/v1/tp'

function getApiKey(): string {
  return import.meta.env.VITE_TFNSW_API_KEY ?? ''
}

export function useTransport() {
  const { state, dispatch } = useAppContext()

  const fetchDepartures = useCallback(async (stop: SavedStop) => {
    dispatch({ type: 'SET_TRANSPORT_LOADING', payload: true })
    dispatch({ type: 'SET_TRANSPORT_ERROR', payload: null })

    const apiKey = getApiKey()
    if (!apiKey) {
      dispatch({ type: 'SET_TRANSPORT_ERROR', payload: 'API_KEY_MISSING' })
      dispatch({ type: 'SET_TRANSPORT_LOADING', payload: false })
      return false
    }

    const params = new URLSearchParams({
      outputFormat: 'rapidJSON',
      mode: 'direct',
      type_dm: 'stop',
      name_dm: stop.id,
      departureMonitorMacro: 'true',
      TfNSWDM: 'true',
      version: '10.2.1.42',
    })

    try {
      const response = await fetch(`${BASE_URL}/departure_mon?${params}`, {
        headers: { Authorization: `apikey ${apiKey}` },
      })

      if (response.status === 401 || response.status === 403) {
        dispatch({ type: 'SET_TRANSPORT_ERROR', payload: 'API_KEY_INVALID' })
        return false
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const json = await response.json()
      const stopEvents: unknown[] = json.stopEvents ?? []

      const departures: Departure[] = stopEvents.slice(0, 5).map((event: unknown) => {
        const e = event as Record<string, unknown>
        const transportation = e.transportation as Record<string, unknown>
        const product = transportation.product as Record<string, unknown>
        const destination = transportation.destination as Record<string, unknown>
        return {
          mode: product.class as number,
          routeNumber: transportation.number as string,
          destination: destination.name as string,
          plannedTime: e.departureTimePlanned as string,
          estimatedTime: (e.departureTimeEstimated as string | undefined) ?? null,
        }
      })

      dispatch({ type: 'SET_DEPARTURES', payload: departures })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch departures'
      dispatch({ type: 'SET_TRANSPORT_ERROR', payload: message })
      return false
    } finally {
      dispatch({ type: 'SET_TRANSPORT_LOADING', payload: false })
    }
  }, [dispatch])

  const searchStops = useCallback(async (query: string): Promise<Array<{ id: string; name: string; suburb: string }>> => {
    const apiKey = getApiKey()
    if (!apiKey || !query.trim()) return []

    const params = new URLSearchParams({
      outputFormat: 'rapidJSON',
      type_sf: 'any',
      name_sf: query,
      coordOutputFormat: 'EPSG:4326',
    })

    try {
      const response = await fetch(`${BASE_URL}/stop_finder?${params}`, {
        headers: { Authorization: `apikey ${apiKey}` },
      })
      if (!response.ok) return []
      const json = await response.json()
      const locations: unknown[] = json.locations ?? []
      return locations.slice(0, 10).map((loc: unknown) => {
        const l = loc as Record<string, unknown>
        const assignedStops = l.assignedStops as Array<Record<string, unknown>> | undefined
        const id = assignedStops?.[0]?.id as string ?? l.id as string
        const parent = l.parent as Record<string, unknown> | undefined
        const suburb = parent?.name as string ?? ''
        return { id, name: l.name as string, suburb }
      })
    } catch {
      return []
    }
  }, [])

  return {
    fetchDepartures,
    searchStops,
    departures: state.departures,
    transportLoading: state.transportLoading,
    transportError: state.transportError,
  }
}
