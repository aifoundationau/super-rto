import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, GraduationCap, CheckCheck } from 'lucide-react';
import { authenticatedFetch } from '@/lib/firebase/client';

interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  userEmail: string;
  onOpenNotification?: (notification: AppNotification) => void;
}

const POLL_INTERVAL_MS = 60_000;

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ userEmail, onOpenNotification }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadNotifications = useCallback(async () => {
    try {
      const res = await authenticatedFetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadNotifications, userEmail]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markRead = async (ids?: string[]) => {
    setNotifications((prev) => prev.map((n) => (!ids || ids.includes(n.id) ? { ...n, read: true } : n)));
    try {
      await authenticatedFetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids ? { ids } : {}),
      });
    } catch (err) {
      console.warn('Failed to mark notifications read:', err);
    }
  };

  const handleOpenItem = (n: AppNotification) => {
    if (!n.read) markRead([n.id]);
    setIsOpen(false);
    onOpenNotification?.(n);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        data-testid="navbar-notifications-btn"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        className="relative p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-700 transition-colors cursor-pointer shadow-2xs"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-extrabold text-slate-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markRead()}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-slate-500">You have no notifications yet.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleOpenItem(n)}
                    className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                      n.read ? '' : 'bg-indigo-50/60'
                    }`}
                  >
                    <span className="mt-0.5 p-1.5 rounded-lg bg-indigo-100 text-indigo-700 h-fit shrink-0">
                      <GraduationCap className="w-3.5 h-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-xs text-slate-900 ${n.read ? 'font-semibold' : 'font-extrabold'}`}>
                        {n.title}
                      </span>
                      <span className="block text-[11px] text-slate-600 mt-0.5">{n.body}</span>
                      <span className="block text-[10px] text-slate-400 mt-1">{formatWhen(n.createdAt)}</span>
                    </span>
                    {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-indigo-600 shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
