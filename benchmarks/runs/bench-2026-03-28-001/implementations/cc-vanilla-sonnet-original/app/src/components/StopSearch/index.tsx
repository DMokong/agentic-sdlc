import { useState, useCallback, useRef, useEffect } from 'react';
import type { Stop, TransportMode } from '../../types';
import { searchStops } from '../../api/tfnsw';
import { useApp } from '../../context/AppContext';
import { getModeInfo } from '../../data/transportModes';

interface StopSearchProps {
  mode?: TransportMode;
  placeholder: string;
  onSelect: (stop: Stop) => void;
  excludeStopIds?: string[];
}

export default function StopSearch({ mode, placeholder, onSelect, excludeStopIds = [] }: StopSearchProps) {
  const { state } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setResults([]); return; }
    if (!state.apiKey) { setResults([]); return; }
    setLoading(true);
    try {
      const stops = await searchStops(q, state.apiKey, mode);
      setResults(stops.filter(s => !excludeStopIds.includes(s.id)));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [state.apiKey, mode, excludeStopIds]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  function handleSelect(stop: Stop) {
    setQuery(stop.name);
    setOpen(false);
    setResults([]);
    onSelect(stop);
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map(stop => (
            <li key={stop.id}>
              <button
                type="button"
                onClick={() => handleSelect(stop)}
                className="w-full text-left px-3 py-3 hover:bg-blue-50 flex items-center gap-2 min-h-[44px]"
              >
                <span className="flex-1 text-sm font-medium text-gray-800">{stop.name}</span>
                <span className="flex gap-1">
                  {stop.modes.map(m => (
                    <span key={m} className="text-xs">{getModeInfo(m).icon}</span>
                  ))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
