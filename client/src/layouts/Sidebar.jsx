import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  LayoutDashboard,
  Briefcase,
  User,
  Shield,
  LogOut,
  Plus,
  FolderKanban,
  ChevronDown
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar, onCreateWorkspaceClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch workspaces to list in sidebar
  const fetchWorkspaces = async () => {
    try {
      const response = await api.get('/workspaces');
      if (response.data.success) {
        setWorkspaces(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error.message);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
    
    // Refresh workspaces list on custom event (e.g. when a new one is created)
    window.addEventListener('workspaceCreated', fetchWorkspaces);
    window.addEventListener('workspaceDeleted', fetchWorkspaces);
    return () => {
      window.removeEventListener('workspaceCreated', fetchWorkspaces);
      window.removeEventListener('workspaceDeleted', fetchWorkspaces);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-white/5 bg-slate-950/80 backdrop-blur-xl transition-transform duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-full flex-col justify-between p-5">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-lg shadow-lg shadow-brand-500/30">
              T
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              TaskFlow
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="mt-8 space-y-1.5">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-600/10 text-brand-400 border border-brand-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                }`
              }
              onClick={toggleSidebar}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-600/10 text-brand-400 border border-brand-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                }`
              }
              onClick={toggleSidebar}
            >
              <User size={18} />
              <span>My Profile</span>
            </NavLink>

            {/* Admin-only route */}
            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'text-slate-400 hover:text-red-400 hover:bg-red-950/10 border border-transparent'
                  }`
                }
                onClick={toggleSidebar}
              >
                <Shield size={18} />
                <span>Admin Console</span>
              </NavLink>
            )}
          </nav>

          {/* Workspaces Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between px-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Workspaces
              </span>
              <button
                onClick={onCreateWorkspaceClick}
                className="p-1 rounded-md text-slate-500 hover:text-brand-400 hover:bg-white/5 transition-all"
                title="Create Workspace"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Workspace lists */}
            <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
              {workspaces.length === 0 ? (
                <p className="text-xs text-slate-600 px-2 py-1">No workspaces</p>
              ) : (
                workspaces.map((ws) => (
                  <NavLink
                    key={ws._id}
                    to={`/workspaces/${ws._id}`}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-white/5 text-slate-100 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`
                    }
                    onClick={toggleSidebar}
                  >
                    <FolderKanban size={16} className="text-brand-500" />
                    <span className="truncate">{ws.name}</span>
                  </NavLink>
                ))
              )}
            </div>
          </div>
        </div>

        {/* User Identity Footer */}
        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-3 truncate">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-10 w-10 rounded-full border border-white/10 object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white font-bold text-sm uppercase">
                  {user?.name.charAt(0)}
                </div>
              )}
              <div className="truncate">
                <p className="text-sm font-semibold text-slate-200 truncate">
                  {user?.name}
                </p>
                <span className="inline-block px-2 py-0.5 mt-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/5 text-slate-400">
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-950/10 transition-all duration-200"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
