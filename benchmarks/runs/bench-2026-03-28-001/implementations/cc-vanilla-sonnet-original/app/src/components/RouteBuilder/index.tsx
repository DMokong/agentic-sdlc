import { useState } from 'react';
import type { TransportMode, Stop, RouteLeg, SavedRoute } from '../../types';
import { useApp } from '../../context/AppContext';
import LegForm from './LegForm';

interface LegDraft {
  id: string;
  mode: TransportMode;
  originStop: Stop | null;
  destStop: Stop | null;
}

interface Props {
  onClose: () => void;
  existing?: SavedRoute;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function RouteBuilder({ onClose, existing }: Props) {
  const { dispatch } = useApp();
  const [name, setName] = useState(existing?.name ?? '');
  const [legs, setLegs] = useState<LegDraft[]>(
    existing
      ? existing.legs.map(l => ({
          id: l.id,
          mode: l.mode,
          originStop: null,
          destStop: null,
        }))
      : [{ id: genId(), mode: 'train', originStop: null, destStop: null }]
  );
  const [error, setError] = useState('');

  function addLeg() {
    setLegs(prev => [...prev, { id: genId(), mode: 'train', originStop: null, destStop: null }]);
  }

  function removeLeg(idx: number) {
    setLegs(prev => prev.filter((_, i) => i !== idx));
  }

  function updateLeg(idx: number, patch: Partial<LegDraft>) {
    setLegs(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));
  }

  function handleSave() {
    if (!name.trim()) { setError('Please enter a route name.'); return; }
    for (const leg of legs) {
      if (!leg.originStop || !leg.destStop) { setError('Please select origin and destination for all legs.'); return; }
    }
    const routeLegs: RouteLeg[] = legs.map(l => ({
      id: l.id,
      originStopId: l.originStop!.id,
      destinationStopId: l.destStop!.id,
      mode: l.mode,
    }));
    const route: SavedRoute = {
      id: existing?.id ?? genId(),
      name: name.trim(),
      legs: routeLegs,
      createdAt: existing?.createdAt ?? Date.now(),
    };
    if (existing) {
      dispatch({ type: 'UPDATE_ROUTE', route });
    } else {
      dispatch({ type: 'ADD_ROUTE', route });
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{existing ? 'Edit Route' : 'New Route'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Route name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Morning commute"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {legs.map((leg, i) => (
            <LegForm
              key={leg.id}
              legIndex={i}
              mode={leg.mode}
              originStop={leg.originStop}
              destStop={leg.destStop}
              onModeChange={mode => updateLeg(i, { mode })}
              onOriginSelect={stop => updateLeg(i, { originStop: stop })}
              onDestSelect={stop => updateLeg(i, { destStop: stop })}
              onRemove={() => removeLeg(i)}
            />
          ))}
          <button
            type="button"
            onClick={addLeg}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 min-h-[44px]"
          >
            + Add leg
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="p-4 border-t">
          <button
            onClick={handleSave}
            className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 min-h-[44px]"
          >
            {existing ? 'Save changes' : 'Save route'}
          </button>
        </div>
      </div>
    </div>
  );
}
