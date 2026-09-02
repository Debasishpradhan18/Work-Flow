import React, { useEffect, useState, useRef } from 'react';
import { Bell, Check, Circle, Trash2, X } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';

const NotificationsDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { socket } = useSocket();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      if (response.data && response.data.success) {
        const list = response.data.data || [];
        setNotifications(list);
        const unread = list.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error.message);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Listen to Socket.IO real-time notification events
  useEffect(() => {
    if (socket) {
      socket.on('new_notification', (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      socket.on('chat_notification', () => {
        fetchNotifications();
      });
    }

    return () => {
      if (socket) {
        socket.off('new_notification');
        socket.off('chat_notification');
      }
    };
  }, [socket]);

  const handleMarkAsRead = async (id) => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await api.put('/notifications/read-all');
      if (response.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error.message);
    }
  };

  const handleClearAll = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Optimistically clear notifications from state
    setNotifications([]);
    setUnreadCount(0);
    try {
      await api.delete('/notifications/clear-all');
    } catch (error) {
      console.error('Failed to clear notifications on server:', error.message);
    }
  };

  const handleDeleteOne = async (id, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Optimistically remove notification
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    setUnreadCount((prev) => {
      const removed = notifications.find((n) => n._id === id);
      return removed && !removed.isRead ? Math.max(0, prev - 1) : prev;
    });

    try {
      await api.delete(`/notifications/${id}`);
    } catch (error) {
      console.error('Failed to delete notification:', error.message);
    }
  };

  const handleNotificationClick = (n) => {
    handleMarkAsRead(n._id);
    setIsOpen(false);
    if (n.relatedProject) {
      if (n.relatedTask) {
        navigate(
          `/projects/${n.relatedProject._id || n.relatedProject}?task=${
            n.relatedTask._id || n.relatedTask
          }`
        );
      } else {
        navigate(`/projects/${n.relatedProject._id || n.relatedProject}`);
      }
    }
  };

  const handleToggleDropdown = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      if (unreadCount > 0) {
        handleMarkAllAsRead();
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button
        onClick={handleToggleDropdown}
        className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all duration-200"
        title="Notifications"
        type="button"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white ring-2 ring-slate-950">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-84 sm:w-96 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-slate-950/60">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Notifications {notifications.length > 0 && `(${notifications.length})`}
            </span>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1.5 text-[11px] text-red-400 hover:text-red-300 font-semibold px-2.5 py-1 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer"
                title="Clear all notifications"
              >
                <Trash2 size={12} />
                <span>Clear all</span>
              </button>
            )}
          </div>

          {/* List items */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <p className="text-xs text-slate-400 font-semibold">No notifications</p>
                <p className="text-[10px] text-slate-600 mt-1">
                  You're all caught up! New updates will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`flex items-start gap-3 p-3.5 hover:bg-white/[0.04] cursor-pointer transition-all relative group ${
                    !n.isRead ? 'bg-brand-500/[0.04]' : ''
                  }`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex-shrink-0 mt-1">
                    {!n.isRead ? (
                      <Circle size={7} className="fill-brand-500 text-brand-500" />
                    ) : (
                      <Circle size={7} className="text-slate-700" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-xs text-slate-200 font-medium leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {new Date(n.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* Delete individual notification button */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteOne(n._id, e)}
                    className="absolute top-3 right-3 p-1 rounded-md text-slate-600 hover:text-red-400 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
