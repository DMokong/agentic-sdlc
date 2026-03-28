import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { BehaviorPattern } from '../types';

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? (sorted[mid] ?? 0)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

export function useBehaviorLearning(routeId: string) {
  const { state, dispatch } = useApp();

  // Log a check-in for this route on mount
  useEffect(() => {
    const now = Date.now();
    dispatch({
      type: 'LOG_BEHAVIOR',
      entry: { routeId, checkedAt: now, dayOfWeek: new Date(now).getDay() },
    });
  }, [routeId, dispatch]);

  // Derive patterns after log updates
  useEffect(() => {
    const log = state.behaviorLog;
    const routeIds = [...new Set(log.map(e => e.routeId))];
    const patterns: BehaviorPattern[] = [];

    for (const rid of routeIds) {
      for (let day = 0; day < 7; day++) {
        const entries = log.filter(e => e.routeId === rid && e.dayOfWeek === day);
        if (entries.length < 3) continue;

        const totalMinutes = entries.map(e => {
          const d = new Date(e.checkedAt);
          return d.getHours() * 60 + d.getMinutes();
        });
        const medMin = median(totalMinutes);
        const hour = Math.floor(medMin / 60);
        const minute = Math.round(medMin % 60);

        patterns.push({
          routeId: rid,
          typicalDepartureHour: hour,
          typicalDepartureMinute: minute,
          confidence: Math.min(entries.length / 10, 1),
        });
      }
    }

    dispatch({ type: 'SET_PATTERNS', patterns });
  }, [state.behaviorLog, dispatch]);

  // Return pattern for current route (any day)
  const pattern = state.behaviorPatterns.find(p => p.routeId === routeId) ?? null;
  return { pattern };
}
