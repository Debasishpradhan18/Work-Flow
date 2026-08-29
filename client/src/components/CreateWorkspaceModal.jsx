import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../services/api';

const CreateWorkspaceModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Workspace name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/workspaces', {
        name: name.trim(),
        description: description.trim()
      });

      if (response.data.success) {
        setName('');
        setDescription('');
        // Trigger sidebar reload
        window.dispatchEvent(new Event('workspaceCreated'));
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-6 relative animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
        >
          <X size={18} />
        </button>

        <h3 className="text-lg font-bold text-slate-100 mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Create New Workspace
        </h3>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Workspace Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Acme Marketing, Dev Squad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full glass-input"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Description (Optional)
            </label>
            <textarea
              placeholder="Brief summary of what this workspace is about..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full glass-input resize-none"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="glass-btn-secondary py-2 px-4 text-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="glass-btn-primary py-2 px-4 text-sm"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkspaceModal;
