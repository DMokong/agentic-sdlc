import type { TransportMode, Stop } from '../../types';
import { getModeInfo } from '../../data/transportModes';
import StopSearch from '../StopSearch';

const MODES: TransportMode[] = ['train', 'metro', 'tram', 'ferry', 'bus'];

interface Props {
  legIndex: number;
  mode: TransportMode;
  originStop: Stop | null;
  destStop: Stop | null;
  onModeChange: (mode: TransportMode) => void;
  onOriginSelect: (stop: Stop) => void;
  onDestSelect: (stop: Stop) => void;
  onRemove: () => void;
}

export default function LegForm({
  legIndex, mode, originStop, destStop,
  onModeChange, onOriginSelect, onDestSelect, onRemove
}: Props) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Leg {legIndex + 1}</p>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-600 hover:text-red-700 min-h-[44px] px-2"
        >
          Remove
        </button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {MODES.map(m => {
          const info = getModeInfo(m);
          return (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm min-h-[44px] ${
                mode === m
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <span>{info.icon}</span>
              <span>{info.label}</span>
            </button>
          );
        })}
      </div>
      <div className="space-y-2">
        <StopSearch
          mode={mode}
          placeholder={originStop ? originStop.name : 'From stop…'}
          onSelect={onOriginSelect}
        />
        <StopSearch
          mode={mode}
          placeholder={destStop ? destStop.name : 'To stop…'}
          onSelect={onDestSelect}
          excludeStopIds={originStop ? [originStop.id] : []}
        />
      </div>
    </div>
  );
}
