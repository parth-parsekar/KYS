import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { api } from '../api/client';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type?: 'created' | 'updated' | 'deleted' | 'system' | 'default';
  timestamp?: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  unreadCount: number;
  latestNotification: any | null;
  recentNotifications: any[];
  activeToast: ToastNotification | null;
  dismissToast: () => void;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [latestNotification, setLatestNotification] = useState<any | null>(null);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [activeToast, setActiveToast] = useState<ToastNotification | null>(null);

  const refreshNotifications = async () => {
    if (!token) return;
    try {
      const res = await api.getNotifications({ status: 'all' });
      if (res.success) {
        setUnreadCount(res.unreadCount);
        setRecentNotifications(res.all ? res.all.slice(0, 10) : []);
      }
    } catch (e) {
      console.warn('Failed to refresh notifications', e);
    }
  };

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    refreshNotifications();

    const socketTarget = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/+$/, '')
      : window.location.origin;

    const socketInstance = io(socketTarget, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      socketInstance.emit('join_user_room', token);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('notification:new', (notif: any) => {
      setLatestNotification(notif);
      setUnreadCount((prev) => prev + 1);

      // Add to recent list
      setRecentNotifications((prev) => [
        {
          _id: notif.id || notif._id || Date.now().toString(),
          title: notif.title || 'New Notification',
          message: notif.message || '',
          isRead: false,
          createdAt: notif.createdAt || new Date().toISOString(),
          type: notif.type || 'system',
        },
        ...prev,
      ]);

      // Determine toast style
      let toastType: ToastNotification['type'] = 'default';
      if (notif.title?.includes('New Event') || notif.type === 'event:created') {
        toastType = 'created';
      } else if (notif.title?.includes('Updated') || notif.type === 'event:updated') {
        toastType = 'updated';
      } else if (notif.title?.includes('Cancelled') || notif.title?.includes('Deleted') || notif.type === 'event:deleted') {
        toastType = 'deleted';
      }

      setActiveToast({
        id: Date.now().toString(),
        title: notif.title || 'Notification Received',
        message: notif.message || '',
        type: toastType,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    });

    socketInstance.on('budget:alert', (alert: any) => {
      setLatestNotification(alert);
      setUnreadCount((prev) => prev + 1);
      setActiveToast({
        id: Date.now().toString(),
        title: alert.title || 'Budget Threshold Alert',
        message: alert.message || '',
        type: 'deleted',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, user?.id]);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  const dismissToast = () => {
    setActiveToast(null);
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await api.markNotificationRead(id);
      if (res.success) {
        setUnreadCount(res.unreadCount);
        setRecentNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await api.markAllNotificationsRead();
      if (res.success) {
        setUnreadCount(0);
        setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        unreadCount,
        latestNotification,
        recentNotifications,
        activeToast,
        dismissToast,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
      {/* Real-time Toast Banner */}
      {activeToast && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full bg-white border border-[#E5E7EB] shadow-2xl rounded-2xl p-4 flex items-start space-x-3 transition-all animate-bounce-short">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm ${
              activeToast.type === 'created'
                ? 'bg-emerald-600'
                : activeToast.type === 'updated'
                ? 'bg-amber-500'
                : activeToast.type === 'deleted'
                ? 'bg-red-600'
                : 'bg-[#18181B]'
            }`}
          >
            {activeToast.type === 'created'
              ? '✨'
              : activeToast.type === 'updated'
              ? '✏️'
              : activeToast.type === 'deleted'
              ? '🗑️'
              : '🔔'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#111827] truncate">
                {activeToast.title}
              </h4>
              <span className="text-[10px] text-[#9CA3AF] shrink-0 ml-2">
                {activeToast.timestamp}
              </span>
            </div>
            <p className="text-[11px] text-[#4B5563] mt-1 leading-relaxed">
              {activeToast.message}
            </p>
          </div>
          <button
            onClick={dismissToast}
            className="text-[#9CA3AF] hover:text-[#111827] p-1 rounded-md transition-colors"
            aria-label="Dismiss toast"
          >
            ✕
          </button>
        </div>
      )}
    </SocketContext.Provider>
  );
};

export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
