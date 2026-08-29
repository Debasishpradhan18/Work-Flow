import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Users,
  ShieldAlert,
  Search,
  SlidersHorizontal,
  FolderOpen,
  Briefcase,
  ListTodo,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

const AdminPage = () => {
  // Stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Users listing
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [usersLoading, setUsersLoading] = useState(true);

  // Error/Success
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAdminStats = async () => {
    try {
      setStatsLoading(true);
      const response = await api.get('/dashboard/admin');
      if (response.data.success) {
        setStats(response.data.data.stats);
      }
    } catch (err) {
      setError('Failed to load system stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (roleFilter) queryParams.append('role', roleFilter);

      const response = await api.get(`/users?${queryParams.toString()}`);
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch user accounts');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
    fetchUsers();
  }, []);

  // Trigger search on debounce/submit
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setError('');
      setSuccess('');
      const response = await api.put(`/users/${userId}/role`, { role: newRole });
      if (response.data.success) {
        setSuccess('User role updated successfully');
        setUsers(prev =>
          prev.map(u => (u._id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      setError('');
      setSuccess('');
      const nextStatus = !currentStatus;
      const response = await api.put(`/users/${userId}/status`, { isActive: nextStatus });
      if (response.data.success) {
        setSuccess(`User accounts has been ${nextStatus ? 'activated' : 'deactivated'}`);
        setUsers(prev =>
          prev.map(u => (u._id === userId ? { ...u, isActive: nextStatus } : u))
        );
        fetchAdminStats(); // Refresh active user counts
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change user status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
          <ShieldAlert className="text-red-500" /> Admin Console
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Manage system accounts, update roles, toggle user statuses, and view system statistics.
        </p>
      </div>

      {/* Alert banner */}
      {(error || success) && (
        <div className="space-y-2">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/20 text-xs text-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-300">
              {success}
            </div>
          )}
        </div>
      )}

      {/* Admin KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Users */}
        <div className="glass-card p-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Users
          </span>
          <h3 className="text-xl font-black text-slate-100 mt-1">{stats?.totalUsers}</h3>
          <span className="text-[9px] text-emerald-400 font-medium">{stats?.activeUsers} Active</span>
        </div>

        {/* Workspaces */}
        <div className="glass-card p-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Workspaces
          </span>
          <h3 className="text-xl font-black text-slate-100 mt-1">{stats?.totalWorkspaces}</h3>
          <span className="text-[9px] text-slate-500 font-medium">Across workspaces</span>
        </div>

        {/* Projects */}
        <div className="glass-card p-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Projects
          </span>
          <h3 className="text-xl font-black text-slate-100 mt-1">{stats?.totalProjects}</h3>
          <span className="text-[9px] text-slate-500 font-medium">In system database</span>
        </div>

        {/* Tasks */}
        <div className="glass-card p-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Tasks
          </span>
          <h3 className="text-xl font-black text-slate-100 mt-1">{stats?.totalTasks}</h3>
          <span className="text-[9px] text-slate-500 font-medium">Kanban assignments</span>
        </div>

        {/* Active Ratio */}
        <div className="glass-card p-4 col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            User Active Ratio
          </span>
          <h3 className="text-xl font-black text-slate-100 mt-1">
            {stats?.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
          </h3>
          <span className="text-[9px] text-slate-500 font-medium">Account health</span>
        </div>
      </div>

      {/* Users management list */}
      <div className="space-y-4">
        {/* Filters */}
        <form onSubmit={handleFilterSubmit} className="flex flex-col sm:flex-row gap-3 bg-slate-900/40 border border-white/5 rounded-2xl p-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input text-xs pl-10 py-2.5"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="member">Member</option>
            </select>

            <button type="submit" className="glass-btn-primary py-2 px-6 text-xs font-semibold">
              Filter
            </button>
          </div>
        </form>

        {/* User Accounts Table */}
        <div className="glass-card p-0 overflow-hidden border border-white/5 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-white/5">
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">System Role</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {usersLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Loading user data...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No matching user records found
                    </td>
                  </tr>
                ) : (
                  users.map((item) => (
                    <tr key={item._id} className="hover:bg-white/[0.01]">
                      {/* Name / Avatar */}
                      <td className="p-4 font-semibold text-slate-200">
                        <div className="flex items-center gap-2.5">
                          {item.avatar ? (
                            <img src={item.avatar} alt={item.name} className="h-7 w-7 rounded-full object-cover" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-slate-800 text-slate-300 border border-white/5 flex items-center justify-center font-bold text-[10px] uppercase">
                              {item.name.charAt(0)}
                            </div>
                          )}
                          <span>{item.name}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="p-4 text-slate-400">{item.email}</td>

                      {/* Role */}
                      <td className="p-4">
                        <select
                          value={item.role}
                          onChange={(e) => handleRoleChange(item._id, e.target.value)}
                          className="bg-slate-950 border border-white/10 rounded px-2.5 py-1 text-[11px] font-bold text-slate-300 focus:outline-none"
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="member">Member</option>
                        </select>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                            <CheckCircle size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400">
                            <XCircle size={12} /> Suspended
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleStatusToggle(item._id, item.isActive)}
                          className={`p-1.5 rounded-xl hover:bg-white/5 transition-all inline-flex items-center gap-1 text-[10px] font-bold ${
                            item.isActive ? 'text-red-400' : 'text-emerald-400'
                          }`}
                          title={item.isActive ? 'Suspend User' : 'Activate User'}
                        >
                          {item.isActive ? (
                            <>
                              <ToggleLeft size={16} /> Suspend
                            </>
                          ) : (
                            <>
                              <ToggleRight size={16} /> Activate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
