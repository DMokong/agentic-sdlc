import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNotifications } from '../../hooks/useNotifications';
import * as storage from '../../utils/storage';

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  const { state, dispatch } = useApp();
  const { enabled, setEnabled, requestPermission } = useNotifications();
  const [apiKeyInput, setApiKeyInput] = useState(state.apiKey);
  const [nameInput, setNameInput] = useState(storage.get<string>('user_name') ?? '');
  const [notifEnabled, setNotifEnabled] = useState(enabled);

  function handleSave() {
    dispatch({ type: 'SET_API_KEY', key: apiKeyInput.trim() });
    storage.set('user_name', nameInput.trim());
    setEnabled(notifEnabled);
    if (notifEnabled) requestPermission();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your first name (optional)</label>
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TfNSW API Key</label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="Enter your API key"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Required for transport data. Get yours from Transport for NSW Open Data.</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Commute notifications</p>
              <p className="text-xs text-gray-500">Get alerts before your usual departure time</p>
            </div>
            <button
              onClick={() => setNotifEnabled(!notifEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${notifEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifEnabled ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
        <div className="p-4 border-t">
          <button
            onClick={handleSave}
            className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 min-h-[44px]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
