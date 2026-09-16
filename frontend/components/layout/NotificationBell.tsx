'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { apiRequest } from '@/lib/api';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    const res = await apiRequest('/notifications');
    if (res.success && res.data) {
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await apiRequest(`/notifications/${id}/read`, { method: 'POST' });
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    await apiRequest('/notifications/read-all', { method: 'POST' });
    fetchNotifications();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-[#141824] border border-[#262e42] text-gray-300 hover:text-white hover:border-[#3d4866] hover:bg-[#1b2131] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] active:scale-95 transition-all duration-150 shrink-0"
        title={unreadCount > 0 ? `${unreadCount} unread campus alerts` : 'Campus Alerts'}
        aria-label="Campus alerts and notifications"
        aria-expanded={isOpen}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-br from-rose-500 to-rose-600 text-white font-bold text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-md shadow-rose-950/60 border border-[#0d101a]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-[#121522] border border-[#293246] rounded-2xl shadow-2xl z-50 overflow-hidden text-xs animate-tab-fade">
          <div className="flex items-center justify-between p-3.5 border-b border-[#242c3f] bg-[#161a29]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-100 tracking-wide text-xs">Campus Alerts</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/80 text-[10px] font-mono font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-gold hover:text-[#e4c257] hover:underline font-semibold transition"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#202738] no-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                No notifications to display
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 transition-colors ${
                    n.isRead ? 'bg-[#121522] opacity-75' : 'bg-[#181d2e] hover:bg-[#1c2236]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-gray-200 text-xs">
                      {n.title}
                    </span>
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(n.id, e)}
                        className="text-gray-400 hover:text-emerald-400 p-1 rounded-md hover:bg-[#252c42] transition"
                        title="Mark as read"
                        aria-label="Mark notification as read"
                      >
                        <Check size={13} />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-300 leading-relaxed text-[11px] mb-1.5">
                    {n.message}
                  </p>
                  <div className="text-[10px] text-gray-400 font-mono">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                    {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
