import React from 'react';
import { Menu, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationsDropdown from '../components/NotificationsDropdown';

const Navbar = ({ toggleSidebar, title }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/5 bg-slate-950/80 backdrop-blur-xl px-4 md:px-6">
      {/* Left side: title and mobile toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 md:hidden transition-all"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-base font-bold text-slate-100 md:text-lg tracking-tight">
          {title || 'Dashboard'}
        </h2>
      </div>

      {/* Right side: notifications and user avatar */}
      <div className="flex items-center gap-4">
        {/* Notifications component */}
        <NotificationsDropdown />

        {/* User preview */}
        <div className="flex items-center gap-2 border-l border-white/5 pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-200">{user?.name}</p>
            <p className="text-[10px] text-slate-500 font-medium capitalize mt-0.5">
              {user?.role}
            </p>
          </div>
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-8 w-8 rounded-full border border-white/10 object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white font-bold text-xs uppercase">
              {user?.name.charAt(0)}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
