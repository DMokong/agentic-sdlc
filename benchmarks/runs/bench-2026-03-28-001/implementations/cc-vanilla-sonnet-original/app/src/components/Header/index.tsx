import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getGreeting, formatTime } from '../../utils/time';
import * as storage from '../../utils/storage';
import Settings from '../Settings';

interface HeaderProps {
  onRefresh: () => void;
}

export default function Header({ onRefresh }: HeaderProps) {
  const { state } = useApp();
  const [showSettings, setShowSettings] = useState(false);
  const greeting = getGreeting();
  const name = storage.get<string>('user_name');
  const greetingText = name ? `Good ${greeting}, ${name}.` : `Good ${greeting}.`;
  const lastUpdated = state.lastRefreshedAt
    ? `Last updated ${formatTime(new Date(state.lastRefreshedAt).toISOString())}`
    : 'Not yet refreshed';

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{greetingText}</h1>
          <p className="text-xs text-gray-500">{lastUpdated}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={state.isRefreshing}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 min-h-[44px]"
          >
            <span className={state.isRefreshing ? 'animate-spin inline-block' : ''}>↻</span>
            {state.isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center text-lg"
            aria-label="Settings"
          >
            ⚙️
          </button>
        </div>
      </header>
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </>
  );
}
