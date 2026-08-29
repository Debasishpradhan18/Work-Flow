import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  FolderKanban,
  CheckCircle2,
  ListTodo,
  AlertTriangle,
  Users,
  TrendingUp,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard');
      if (response.data.success) {
        setStats(response.data.data.stats);
        setCharts(response.data.data.charts);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-brand-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/20 text-red-200">
        <p className="font-bold text-sm">Dashboard Error</p>
        <p className="text-xs mt-1">{error}</p>
        <button onClick={fetchDashboardData} className="mt-4 glass-btn-primary py-1.5 px-4 text-xs">
          Retry Load
        </button>
      </div>
    );
  }

  // Chart Color Schemes
  const STATUS_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981']; // Todo, In-progress, Review, Completed HSL equivalents
  const PRIORITY_COLORS = ['#34d399', '#f59e0b', '#ef4444']; // Low, Medium, High

  return (
    <div className="space-y-6">
      {/* Top Banner Welcomer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/60 to-slate-950 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Real-time analytics across your active workspaces and project pipelines.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total Projects
            </span>
            <h3 className="text-2xl font-black text-slate-100 mt-1">{stats?.totalProjects}</h3>
            <span className="text-[10px] font-semibold text-emerald-400 inline-flex items-center gap-0.5 mt-1">
              {stats?.activeProjects} Active
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-brand-600/10 border border-brand-500/20 text-brand-400">
            <FolderKanban size={20} />
          </div>
        </div>

        {/* Total Tasks */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Assigned Tasks
            </span>
            <h3 className="text-2xl font-black text-slate-100 mt-1">{stats?.totalTasks}</h3>
            <span className="text-[10px] font-semibold text-brand-400 inline-flex items-center gap-0.5 mt-1">
              {stats?.pendingTasks} Pending
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
            <ListTodo size={20} />
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Completed Tasks
            </span>
            <h3 className="text-2xl font-black text-slate-100 mt-1">{stats?.completedTasks}</h3>
            <span className="text-[10px] font-semibold text-emerald-400 inline-flex items-center gap-0.5 mt-1">
              <CheckCircle2 size={10} /> Clean closure
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Overdue Tasks
            </span>
            <h3 className={`text-2xl font-black mt-1 ${stats?.overdueTasks > 0 ? 'text-red-400' : 'text-slate-100'}`}>
              {stats?.overdueTasks}
            </h3>
            <span className={`text-[10px] font-semibold inline-flex items-center gap-0.5 mt-1 ${stats?.overdueTasks > 0 ? 'text-red-400' : 'text-slate-500'}`}>
              Requires attention
            </span>
          </div>
          <div className={`p-2.5 rounded-xl border ${stats?.overdueTasks > 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-slate-800 border-white/5 text-slate-400'}`}>
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      {stats?.totalProjects === 0 ? (
        <div className="glass-card py-16 flex flex-col items-center justify-center text-center">
          <FolderKanban size={48} className="text-slate-600 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-300">No Projects Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
            Get started by selecting or creating a workspace in the sidebar, then build your first project to view metrics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Tasks by Status */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-400" />
              Tasks by Status
            </h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.tasksByStatus} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {charts?.tasksByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Tasks by Priority */}
          <div className="glass-card p-5 flex flex-col">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-indigo-400" />
              Tasks by Priority
            </h3>
            <div className="h-60 flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts?.tasksByPriority}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts?.tasksByPriority.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Completed Tasks Over Time */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-emerald-400" />
              Completed Tasks (Last 7 Days)
            </h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts?.tasksOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#34d399', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Project Progress */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FolderKanban size={16} className="text-purple-400" />
                Active Projects Completion
              </span>
            </h3>
            <div className="space-y-4 py-2">
              {charts?.projectProgress.map((project, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300 truncate max-w-[200px]">
                      {project.name}
                    </span>
                    <span className="font-bold text-brand-400">{project.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 border border-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {project.tasksCount} total tasks inside project
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
