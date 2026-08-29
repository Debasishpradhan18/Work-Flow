import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      {/* Background accent */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-card text-center relative z-10 py-12">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-950/40 border border-red-500/20 text-red-400 mb-6">
          <AlertCircle size={24} />
        </div>

        <h1 className="text-4xl font-black text-slate-100 tracking-tight leading-none mb-3">
          404
        </h1>
        <h2 className="text-lg font-bold text-slate-300 mb-2">Page Not Found</h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto mb-8 leading-relaxed">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <Link
          to="/dashboard"
          className="glass-btn-primary py-2 px-6 text-sm font-semibold inline-block"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
