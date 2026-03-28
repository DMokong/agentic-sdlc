import { useAppContext } from '../../context/AppContext';
import { LocationSearch } from './LocationSearch';
import { StopSearch } from './StopSearch';

export function SettingsPanel() {
  const { setSettingsOpen } = useAppContext();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={() => setSettingsOpen(false)}
      />

      {/* Panel — right drawer on desktop, bottom sheet on mobile */}
      <div className="fixed z-50 bg-gray-800 border-gray-700 shadow-2xl
        bottom-0 left-0 right-0 rounded-t-2xl border-t p-4 max-h-[80vh] overflow-y-auto
        md:bottom-auto md:top-0 md:left-auto md:right-0 md:h-full md:w-80 md:rounded-none md:border-l md:border-t-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Settings</h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors text-xl"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <LocationSearch />
          <StopSearch />
        </div>
      </div>
    </>
  );
}
