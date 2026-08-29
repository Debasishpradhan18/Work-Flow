import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FolderKanban,
  Zap,
  Users,
  ShieldCheck,
  MessageSquare,
  ChevronRight
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  // If already logged in, send directly to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-lg shadow-lg shadow-brand-500/20">
            T
          </div>
          <span className="text-xl font-black tracking-tight text-white">TaskFlow</span>
        </div>
        <div className="flex gap-4">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Get Started Free
          </Link>
        </div>
      </header>

      {/* Hero Body */}
      <main className="flex-1 flex items-center px-6 py-12 z-10">
        <div className="w-full max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-brand-400">
            <Zap size={14} />
            <span>The ultimate platform for team collaboration</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-6">
            Manage Projects & Teams, <br />
            <span className="bg-gradient-to-r from-brand-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              In Real-Time.
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-slate-400 text-base sm:text-lg mb-10 leading-relaxed">
            TaskFlow combines Kanban boards, instant chat rooms, and real-time activity updates to accelerate your team's workflow in one premium dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              to="/register"
              className="w-full sm:w-auto glass-btn-primary flex items-center justify-center gap-2 group"
            >
              <span>Create Your Workspace</span>
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto glass-btn-secondary flex items-center justify-center"
            >
              Learn More
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left border-t border-white/5 pt-16">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="h-10 w-10 rounded-xl bg-brand-600/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mb-4">
                <FolderKanban size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-200 mb-2">Kanban Boards</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Drag-and-drop tasks across statuses and see immediate updates on your team's screens in real-time.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="h-10 w-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <MessageSquare size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-200 mb-2">Real-Time Chat</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dedicated chat channels inside every project. Brainstorm, attach files, and notify assignees instantly.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="h-10 w-10 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Users size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-200 mb-2">Role Permissions</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Robust role-based access control. Separate permissions for Admins, Managers, and Team Members.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-8 border-t border-white/5 text-center text-xs text-slate-500 z-10">
        <p>&copy; {new Date().getFullYear()} TaskFlow. Built for CSE Placement / Interview Showcase.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
