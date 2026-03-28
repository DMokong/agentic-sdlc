import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatHHmm } from '../utils/time';
import * as storage from '../utils/storage';

interface NotificationSettings {
  enabled: boolean;
}

export function useNotifications() {
  const { state } = useApp();

  const settings = storage.get<NotificationSettings>('notif_settings') ?? { enabled: false };

  useEffect(() => {
    if (!settings.enabled) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [settings.enabled]);

  // Schedule in-session notifications for behavior patterns
  useEffect(() => {
    if (!settings.enabled) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;

    const now = new Date();
    const dow = now.getDay();
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    for (const pattern of state.behaviorPatterns) {
      if (pattern.confidence < 0.3) continue;
      const route = state.savedRoutes.find(r => r.id === pattern.routeId);
      if (!route) continue;

      const target = new Date();
      target.setHours(pattern.typicalDepartureHour, pattern.typicalDepartureMinute, 0, 0);
      const diff = target.getTime() - now.getTime();
      if (diff < 0 || diff > 4 * 60 * 60 * 1000) continue; // only schedule within 4h
      if (new Date(target).getDay() !== dow) continue;

      const id = setTimeout(() => {
        new Notification('Time to check your commute', {
          body: `Your usual ${route.name} trip departs around ${formatHHmm(pattern.typicalDepartureHour, pattern.typicalDepartureMinute)}.`,
        });
      }, diff);
      timeouts.push(id);
    }

    // Advisory notifications
    for (const advisory of state.advisories) {
      for (const route of state.savedRoutes) {
        const affected = route.legs.some(
          leg =>
            advisory.affectedStopIds.includes(leg.originStopId) ||
            advisory.affectedStopIds.includes(leg.destinationStopId)
        );
        if (!affected) continue;
        const pattern = state.behaviorPatterns.find(p => p.routeId === route.id);
        if (!pattern || pattern.confidence < 0.3) continue;

        new Notification(`Alert: ${advisory.header}`, {
          body: `Affects your usual ${route.name} route.`,
        });
      }
    }

    return () => timeouts.forEach(clearTimeout);
  }, [state.behaviorPatterns, state.savedRoutes, state.advisories, settings.enabled]);

  function requestPermission() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }

  function setEnabled(enabled: boolean) {
    storage.set('notif_settings', { enabled });
  }

  return { requestPermission, setEnabled, enabled: settings.enabled };
}
