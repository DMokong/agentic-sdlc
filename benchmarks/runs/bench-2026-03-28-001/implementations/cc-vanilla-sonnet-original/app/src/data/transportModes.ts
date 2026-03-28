import type { TransportMode } from '../types';

export interface ModeInfo {
  label: string;
  icon: string; // emoji
  color: string; // Tailwind text color class
}

const transportModes: Record<TransportMode, ModeInfo> = {
  train:  { label: 'Train',  icon: '🚆', color: 'text-orange-600' },
  metro:  { label: 'Metro',  icon: '🚇', color: 'text-blue-600' },
  tram:   { label: 'Tram',   icon: '🚋', color: 'text-green-600' },
  ferry:  { label: 'Ferry',  icon: '⛴️', color: 'text-teal-600' },
  bus:    { label: 'Bus',    icon: '🚌', color: 'text-red-600' },
};

export function getModeInfo(mode: TransportMode): ModeInfo {
  return transportModes[mode];
}

export default transportModes;
