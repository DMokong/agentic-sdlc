import { useAppContext } from '../../context/AppContext';

interface OnboardingPromptProps {
  type: 'location' | 'stop';
}

export function OnboardingPrompt({ type }: OnboardingPromptProps) {
  const { setSettingsOpen } = useAppContext();
  const message = type === 'location'
    ? 'Set your location to see weather'
    : 'Set your transport stop to see departures';

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-gray-400">
      <span className="text-4xl">{type === 'location' ? '📍' : '🚏'}</span>
      <p className="text-sm text-center">{message}</p>
      <button
        onClick={() => setSettingsOpen(true)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
      >
        Open Settings
      </button>
    </div>
  );
}
