import React, { createContext, useContext, useState, useEffect } from 'react';

interface OfflineSyncItem {
  id: string;
  action: string;
  payload: any;
  timestamp: string;
}

interface OfflineContextType {
  isOnline: boolean;
  syncQueue: OfflineSyncItem[];
  queueAction: (action: string, payload: any) => void;
  syncPendingQueue: () => Promise<void>;
  cachedData: Record<string, any>;
  setCachedItem: (key: string, data: any) => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<OfflineSyncItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('smart_campus_sync_queue') || '[]');
    } catch {
      return [];
    }
  });

  const [cachedData, setCachedData] = useState<Record<string, any>>(() => {
    try {
      return JSON.parse(localStorage.getItem('smart_campus_offline_cache') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker if supported
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('Service worker registration:', err);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const queueAction = (action: string, payload: any) => {
    const item: OfflineSyncItem = {
      id: 'sync_' + Date.now(),
      action,
      payload,
      timestamp: new Date().toISOString()
    };
    const updated = [...syncQueue, item];
    setSyncQueue(updated);
    localStorage.setItem('smart_campus_sync_queue', JSON.stringify(updated));
  };

  const syncPendingQueue = async () => {
    if (syncQueue.length === 0) return;
    console.log(`[Offline Sync] Processing ${syncQueue.length} queued background items...`);
    // Emulate background batch sync
    setSyncQueue([]);
    localStorage.removeItem('smart_campus_sync_queue');
  };

  const setCachedItem = (key: string, data: any) => {
    const updated = { ...cachedData, [key]: data };
    setCachedData(updated);
    localStorage.setItem('smart_campus_offline_cache', JSON.stringify(updated));
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        syncQueue,
        queueAction,
        syncPendingQueue,
        cachedData,
        setCachedItem
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline must be used within an OfflineProvider');
  return context;
};
