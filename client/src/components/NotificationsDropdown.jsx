import React, { useEffect, useState, useRef } from 'react';
import { Bell, Check, Circle } from 'lucide-react';
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
      if (response.data.success) {
        setNotifications(response.data.data);
        // Calculate unread count
        const unread = response.data.data.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error.message);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up click outside listener to close dropdown
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
      // Real-time task/comment notification
      socket.on('new_notification', (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      // Real-time chat notification
      socket.on('chat_notification', (chatNotify) => {
        // Just increment counts or flash top bar
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
        setNotifications(prev =>
          prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await api.put('/notifications/read-all');
      if (response.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error.message);
    }
  };

  const handleNotificationClick = (n) => {
    handleMarkAsRead(n._id);
    setIsOpen(false);
    if (n.relatedProject) {
      if (n.relatedTask) {
        navigate(`/projects/${n.relatedProject._id || n.relatedProject}?task=${n.relatedTask._id || n.relatedTask}`);
      } else {
        navigate(`/projects/${n.relatedProject._id || n.relatedProject}`);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all duration-200"
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
        <div className="absolute right-0 mt-2.5 w-80 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-slate-950/40">
            <span className="text-sm font-bold text-slate-200">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-semibold transition-all"
              >
                <Check size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* List items */}
          <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <p className="text-sm text-slate-500 font-medium">All caught up!</p>
                <p className="text-xs text-slate-600 mt-1">No new notifications.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`flex gap-3 p-3.5 hover:bg-white/[0.02] cursor-pointer transition-all ${
                    !n.isRead ? 'bg-brand-500/[0.03]' : ''
                  }`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {!n.isRead ? (
                      <Circle size={8} className="fill-brand-500 text-brand-500" />
                    ) : (
                      <Circle size={8} className="text-slate-700" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
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
