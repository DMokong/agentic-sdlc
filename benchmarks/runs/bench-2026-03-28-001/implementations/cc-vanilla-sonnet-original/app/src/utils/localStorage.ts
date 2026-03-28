import type { SavedLocation, SavedStop } from '../types';

export function getLocation(): SavedLocation | null {
  try {
    const raw = localStorage.getItem('wt_location');
    return raw ? (JSON.parse(raw) as SavedLocation) : null;
  } catch {
    return null;
  }
}

export function setLocation(loc: SavedLocation): void {
  localStorage.setItem('wt_location', JSON.stringify(loc));
}

export function getStop(): SavedStop | null {
  try {
    const raw = localStorage.getItem('wt_stop');
    return raw ? (JSON.parse(raw) as SavedStop) : null;
  } catch {
    return null;
  }
}

export function setStop(stop: SavedStop): void {
  localStorage.setItem('wt_stop', JSON.stringify(stop));
}
