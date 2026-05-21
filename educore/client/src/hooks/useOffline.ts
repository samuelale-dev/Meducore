import { useEffect, useState, useCallback } from 'react';

interface OnlineStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
}

export const useOffline = (): OnlineStatus => {
  const [status, setStatus] = useState<OnlineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
  });

  const handleOnline = useCallback(() => {
    setStatus((prev) => ({ ...prev, isOnline: true }));
  }, []);

  const handleOffline = useCallback(() => {
    setStatus((prev) => ({ ...prev, isOnline: false }));
  }, []);

  const checkConnectionSpeed = useCallback(async () => {
    try {
      const startTime = performance.now();
      await fetch('/api/health', { method: 'HEAD' });
      const endTime = performance.now();
      const isSlowConnection = endTime - startTime > 3000;
      setStatus((prev) => ({ ...prev, isSlowConnection }));
    } catch {
      setStatus((prev) => ({ ...prev, isSlowConnection: true }));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const speedCheckInterval = setInterval(checkConnectionSpeed, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(speedCheckInterval);
    };
  }, [handleOnline, handleOffline, checkConnectionSpeed]);

  return status;
};

export default useOffline;
