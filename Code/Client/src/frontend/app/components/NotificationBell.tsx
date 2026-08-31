'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  X,
} from 'lucide-react';
import { apiClient, getAccessToken } from '../lib/apiClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const MAX_VISIBLE_NOTIFICATIONS = 30;

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
  readAt: string | null;
}

interface NotificationBellProps {
  className?: string;
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'Vừa xong';
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'Vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(value));
}

function notificationTone(type: string) {
  if (type === 'LOW_STOCK') {
    return {
      icon: AlertTriangle,
      iconClass: 'border-amber-200 bg-amber-50 text-amber-700',
      dotClass: 'bg-amber-500',
    };
  }
  if (type === 'LOW_STOCK_RESOLVED') {
    return {
      icon: PackageCheck,
      iconClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      dotClass: 'bg-emerald-500',
    };
  }
  return {
    icon: Bell,
    iconClass: 'border-blue-200 bg-blue-50 text-blue-700',
    dotClass: 'bg-blue-500',
  };
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [markingIds, setMarkingIds] = useState<Set<number>>(new Set());

  const loadNotifications = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    try {
      const [items, count] = await Promise.all([
        apiClient.get<AppNotification[]>('/api/notifications'),
        apiClient.get<{ count: number }>('/api/notifications/unread-count'),
      ]);
      setNotifications(items.slice(0, MAX_VISIBLE_NOTIFICATIONS));
      setUnreadCount(count.count);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải thông báo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadNotifications(), 0);
    const poller = window.setInterval(() => void loadNotifications(true), 60_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(poller);
    };
  }, [loadNotifications]);

  useEffect(() => {
    const closeWhenClickingOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeWhenClickingOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeWhenClickingOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const controller = new AbortController();

    const connect = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/notifications/stream`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
          signal: controller.signal,
        });
        if (!response.ok || !response.body) return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!controller.signal.aborted) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';
          events.forEach((rawEvent) => {
            const eventName = rawEvent.split('\n')
              .find((line) => line.startsWith('event:'))?.slice(6).trim();
            const data = rawEvent.split('\n')
              .find((line) => line.startsWith('data:'))?.slice(5).trim();
            if (eventName !== 'notification' || !data) return;
            try {
              const notification = JSON.parse(data) as AppNotification;
              setNotifications((current) => [
                notification,
                ...current.filter((item) => item.id !== notification.id),
              ].slice(0, MAX_VISIBLE_NOTIFICATIONS));
              setUnreadCount((current) => current + (notification.read ? 0 : 1));
              window.dispatchEvent(new CustomEvent('hbdt-notification', {
                detail: notification,
              }));
            } catch {
              // Ignore malformed events while preserving the active stream.
            }
          });
        }
      } catch (streamError) {
        if (!controller.signal.aborted) {
          console.warn('Notification stream disconnected', streamError);
        }
      }
    };

    void connect();
    return () => controller.abort();
  }, []);

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.read),
    [notifications],
  );

  const markAsRead = async (notificationId: number) => {
    if (markingIds.has(notificationId)) return;
    setMarkingIds((current) => new Set(current).add(notificationId));
    try {
      const updated = await apiClient.patch<AppNotification>(
        `/api/notifications/${notificationId}/read`,
      );
      setNotifications((current) => current.map((item) => (
        item.id === notificationId ? updated : item
      )));
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : 'Không thể đánh dấu thông báo');
    } finally {
      setMarkingIds((current) => {
        const next = new Set(current);
        next.delete(notificationId);
        return next;
      });
    }
  };

  const markAllAsRead = async () => {
    const ids = unreadNotifications.map((notification) => notification.id);
    if (ids.length === 0) return;
    setMarkingIds(new Set(ids));
    const results = await Promise.allSettled(ids.map((id) => (
      apiClient.patch<AppNotification>(`/api/notifications/${id}/read`)
    )));
    const succeeded = new Set<number>();
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') succeeded.add(ids[index]);
    });
    setNotifications((current) => current.map((item) => (
      succeeded.has(item.id) ? { ...item, read: true, readAt: new Date().toISOString() } : item
    )));
    setUnreadCount((current) => Math.max(0, current - succeeded.size));
    setMarkingIds(new Set());
    if (succeeded.size !== ids.length) setError('Một số thông báo chưa thể cập nhật.');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={`Thông báo${unreadCount > 0 ? `, ${unreadCount} chưa đọc` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
      >
        {unreadCount > 0 ? <BellRing className="h-4.5 w-4.5" /> : <Bell className="h-4.5 w-4.5" />}
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-black leading-4 text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[80] mt-2 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <div>
              <p className="font-black text-slate-950">Thông báo</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Bạn đã xem tất cả thông báo'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Làm mới thông báo"
                onClick={() => void loadNotifications(true)}
                disabled={refreshing}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                aria-label="Đóng thông báo"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {unreadNotifications.length > 0 && (
            <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2 text-right">
              <button
                type="button"
                onClick={() => void markAllAsRead()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Đánh dấu tất cả đã đọc
              </button>
            </div>
          )}

          <div className="max-h-[26rem] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-slate-500">
                <LoaderCircle className="h-5 w-5 animate-spin" /> Đang tải thông báo...
              </div>
            ) : error && notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <AlertTriangle className="mx-auto h-7 w-7 text-red-500" />
                <p className="mt-2 text-sm font-semibold text-red-700">{error}</p>
                <button type="button" onClick={() => void loadNotifications()} className="mt-3 text-xs font-bold text-slate-700 underline">Thử lại</button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Bell className="h-5 w-5" /></div>
                <p className="mt-3 font-bold text-slate-800">Chưa có thông báo</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Cảnh báo tồn kho mới sẽ xuất hiện tại đây.</p>
              </div>
            ) : notifications.map((notification) => {
              const tone = notificationTone(notification.type);
              const Icon = tone.icon;
              const marking = markingIds.has(notification.id);
              return (
                <article key={notification.id} className={`relative border-b border-slate-100 px-4 py-3.5 last:border-0 ${notification.read ? 'bg-white' : 'bg-blue-50/35'}`}>
                  {!notification.read && <span className={`absolute right-3 top-4 h-2 w-2 rounded-full ${tone.dotClass}`} />}
                  <div className="flex gap-3 pr-3">
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${tone.iconClass}`}><Icon className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm text-slate-900 ${notification.read ? 'font-semibold' : 'font-black'}`}>{notification.title}</p>
                      </div>
                      <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600">{notification.content}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <time className="text-[11px] font-medium text-slate-400">{formatRelativeTime(notification.createdAt)}</time>
                        {!notification.read && (
                          <button
                            type="button"
                            onClick={() => void markAsRead(notification.id)}
                            disabled={marking}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 disabled:opacity-50"
                          >
                            {marking ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                            Đã đọc
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {error && notifications.length > 0 && (
            <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
