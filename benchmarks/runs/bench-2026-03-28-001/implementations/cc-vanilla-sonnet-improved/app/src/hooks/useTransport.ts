import { useState, useEffect } from 'react';
import type { Departure, TransportMode } from '../types';
import { useAppContext } from '../context/AppContext';

const PRODUCT_CLASS_MAP: Record<number, TransportMode> = {
  1: 'train',
  4: 'lightrail',
  5: 'bus',
  7: 'coach',
  9: 'ferry',
  11: 'metro',
};

interface UseTransportResult {
  departures: Departure[];
  loading: boolean;
  error: boolean;
  missingApiKey: boolean;
}

export function useTransport(): UseTransportResult {
  const { stop, refreshKey, setLastUpdated } = useAppContext();
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const apiKey = import.meta.env.VITE_TFNSW_API_KEY as string | undefined;
  const missingApiKey = !apiKey || apiKey === 'your_api_key_here';

  useEffect(() => {
    if (!stop || missingApiKey) {
      setDepartures([]);
      setLoading(false);
      setError(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(false);

    const params = new URLSearchParams({
      outputFormat: 'rapidJSON',
      type_dm: 'stop',
      name_dm: stop.stopId,
      departureMonitorMacro: 'true',
      TfNSWTR: 'true',
      limit: '5',
    });

    fetch(`https://api.transport.nsw.gov.au/v1/tp/departure_mon?${params}`, {
      headers: {
        Authorization: `apikey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: {
        stopEvents?: Array<{
          transportation: {
            number: string;
            destination: { name: string };
            product: { class: number };
          };
          departureTimePlanned: string;
          departureTimeEstimated?: string;
        }>;
      }) => {
        const events = (json.stopEvents ?? []).slice(0, 5);
        const deps: Departure[] = events.map(ev => {
          const planned = new Date(ev.departureTimePlanned);
          const estimated = ev.departureTimeEstimated ? new Date(ev.departureTimeEstimated) : null;
          const isDelayed = estimated !== null && (estimated.getTime() - planned.getTime()) > 60_000;
          return {
            mode: PRODUCT_CLASS_MAP[ev.transportation.product.class] ?? 'bus',
            routeNumber: ev.transportation.number,
            destination: ev.transportation.destination.name,
            scheduledDeparture: ev.departureTimePlanned,
            estimatedDeparture: ev.departureTimeEstimated ?? null,
            isDelayed,
          };
        });
        setDepartures(deps);
        setLastUpdated(new Date());
        setLoading(false);
      })
      .catch(err => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(true);
        setLoading(false);
      });

    return () => controller.abort();
  }, [stop, refreshKey, missingApiKey, setLastUpdated]);

  return { departures, loading, error, missingApiKey };
}
