import { useState } from 'react';
import { SUBURBS } from '../../data/suburbs';
import { useAppContext } from '../../context/AppContext';
import type { SavedLocation } from '../../types';

export function LocationSearch() {
  const { location, setLocation } = useAppContext();
  const [query, setQuery] = useState('');

  const filtered = query.length >= 1
    ? SUBURBS.filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
    : SUBURBS;

  function handleSelect(suburb: typeof SUBURBS[number]) {
    const loc: SavedLocation = { name: suburb.name, lat: suburb.lat, lng: suburb.lng };
    setLocation(loc);
    setQuery('');
  }

  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">Location</label>
      {location && (
        <p className="text-sm text-blue-400 mb-2">Current: {location.name}</p>
      )}
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search suburbs..."
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
      />
      {filtered.length > 0 && (
        <ul className="mt-1 max-h-48 overflow-y-auto bg-gray-700 border border-gray-600 rounded-lg divide-y divide-gray-600">
          {filtered.slice(0, 20).map(suburb => (
            <li key={suburb.name}>
              <button
                onClick={() => handleSelect(suburb)}
                className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-600 transition-colors"
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
