import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'EMERGENCY' | 'SUCCESS';
  timestamp: string;
  readAt?: string | null;
  localOnly?: boolean;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  notificationError: string;
  addNotification: (title: string, message: string, type?: NotificationItem['type']) => void;
  markAllRead: () => void;
  clearNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, tenant, token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const localUnreadCount = useRef(0);
  const [notificationError, setNotificationError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      setNotifications([]);
      setUnreadCount(0);
      localUnreadCount.current = 0;
      setNotificationError('');
      return;
    }

    setNotifications([]);
    setUnreadCount(0);
    localUnreadCount.current = 0;
    let active = true;
    let requestInFlight = false;
    const fetchNotifications = async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const response = await fetch('/api/notifications', {
          headers: {
            'X-Tenant-ID': tenant?.id || user.tenant_id,
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || data.error || `Notifications unavailable (${response.status})`);
        }
        if (!active) return;

        const serverNotifications: NotificationItem[] = (data.notifications || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          message: item.message,
          type: item.type,
          timestamp: item.created_at,
          readAt: item.read_at
        }));
        setNotifications((previous) => [
          ...serverNotifications,
          ...previous.filter((item) => item.localOnly)
        ]);
        setUnreadCount((data.unreadCount || 0) + localUnreadCount.current);
        setNotificationError('');
      } catch (error) {
        if (!active) return;
        console.error('Unable to load notifications:', error);
        setNotificationError(error instanceof Error ? error.message : 'Unable to load notifications.');
      } finally {
        requestInFlight = false;
      }
    };

    fetchNotifications();
    const intervalId = window.setInterval(fetchNotifications, 8000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [user?.id, user?.tenant_id, tenant?.id, token]);

  const addNotification = (title: string, message: string, type: NotificationItem['type'] = 'INFO') => {
    const newItem: NotificationItem = {
      id: 'local_' + Date.now(),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      readAt: null,
      localOnly: true
    };
    setNotifications(prev => [newItem, ...prev]);
    setUnreadCount(prev => prev + 1);
    localUnreadCount.current += 1;
  };

  const markAllRead = async () => {
    try {
      if (user && token) {
        const response = await fetch('/api/notifications/read', {
          method: 'POST',
          headers: {
            'X-Tenant-ID': tenant?.id || user.tenant_id,
            Authorization: `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error(`Could not mark notifications read (${response.status})`);
      }
      const readAt = new Date().toISOString();
      setNotifications((previous) => previous.map((item) => ({ ...item, readAt })));
      setUnreadCount(0);
      localUnreadCount.current = 0;
      setNotificationError('');
    } catch (error) {
      console.error('Unable to mark notifications as read:', error);
      setNotificationError(error instanceof Error ? error.message : 'Unable to mark notifications as read.');
    }
  };

  const clearNotification = (id: string) => {
    const removed = notifications.find((item) => item.id === id);
    if (removed?.localOnly && !removed.readAt) {
      localUnreadCount.current = Math.max(0, localUnreadCount.current - 1);
      setUnreadCount((count) => Math.max(0, count - 1));
    }
    setNotifications((previous) => previous.filter((item) => item.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        notificationError,
        addNotification,
        markAllRead,
        clearNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
