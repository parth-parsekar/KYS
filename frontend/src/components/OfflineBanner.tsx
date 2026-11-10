import React, { useEffect, useState } from 'react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setJustReconnected(true);
      const timer = setTimeout(() => setJustReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setJustReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setIsOffline(false);
        setJustReconnected(true);
        setTimeout(() => setJustReconnected(false), 4000);
      }
    } catch {
      setIsOffline(true);
    } finally {
      setIsRetrying(false);
    }
  };

  if (!isOffline && !justReconnected) {
    return null;
  }

  if (justReconnected) {
    return (
      <div className="bg-emerald-600 text-white text-xs py-2 px-4 flex items-center justify-between shadow-sm transition-all duration-300">
        <div className="flex items-center space-x-2 mx-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
          <span className="font-medium">Connection restored. Live updates are active.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#18181B] border-b border-[#27272A] text-white text-xs py-2.5 px-4 shadow-md transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <p className="text-[#E4E4E7]">
            <strong className="text-white font-semibold">Offline Mode:</strong> Live updates and notifications are temporarily paused. Saved data remains accessible.
          </p>
        </div>
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="px-3 py-1 bg-white text-[#18181B] font-medium text-[11px] rounded hover:bg-gray-100 disabled:opacity-50 transition-colors shrink-0"
        >
          {isRetrying ? 'Checking connection...' : 'Retry connection'}
        </button>
      </div>
    </div>
  );
};

