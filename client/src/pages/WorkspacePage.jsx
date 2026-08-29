import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FolderKanban,
  Users,
  Plus,
  Trash2,
  Briefcase,
  Calendar,
  X,
  Mail,
  UserPlus,
  Settings,
  ChevronRight
} from 'lucide-react';

const WorkspacePage = () => {
  const { workspaceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // New project form fields
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectPriority, setProjectPriority] = useState('medium');
  const [projectDueDate, setProjectDueDate] = useState('');
  const [projectError, setProjectError] = useState('');
  const [projectLoading, setProjectLoading] = useState(false);

  // Invitation fields
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const fetchWorkspaceDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const wsResponse = await api.get(`/workspaces/${workspaceId}`);
      if (wsResponse.data.success) {
        setWorkspace(wsResponse.data.data);
      }

      const projResponse = await api.get(`/projects/workspace/${workspaceId}`);
      if (projResponse.data.success) {
        setProjects(projResponse.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load workspace details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceDetails();
  }, [workspaceId]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setProjectError('Project name is required');
      return;
    }

    setProjectLoading(true);
    setProjectError('');

    try {
      const response = await api.post('/projects', {
        name: projectName.trim(),
        description: projectDesc.trim(),
        workspaceId,
        priority: projectPriority,
        dueDate: projectDueDate || null
      });

      if (response.data.success) {
        setProjectName('');
        setProjectDesc('');
        setProjectPriority('medium');
        setProjectDueDate('');
        setProjectModalOpen(false);
        fetchWorkspaceDetails();
      }
    } catch (err) {
      setProjectError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setProjectLoading(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setInviteError('Email is required');
      return;
    }

    setInviteLoading(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      const response = await api.post(`/workspaces/${workspaceId}/members`, {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole
      });

      if (response.data.success) {
        setInviteSuccess('Member added successfully!');
        setInviteEmail('');
        setInviteRole('member');
        // Refresh workspace info (member list)
        setWorkspace(response.data.data);
      }
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    if (!window.confirm('Are you sure you want to remove this member from the workspace?')) return;
    try {
      const response = await api.delete(`/workspaces/${workspaceId}/members/${targetUserId}`);
      if (response.data.success) {
        setWorkspace(response.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      const response = await api.put(`/workspaces/${workspaceId}/members/${targetUserId}/role`, {
        role: newRole
      });
      if (response.data.success) {
        setWorkspace(response.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change role');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!window.confirm('WARNING: Deleting this workspace will delete all its references. Proceed?')) return;
    try {
      const response = await api.delete(`/workspaces/${workspaceId}`);
      if (response.data.success) {
        window.dispatchEvent(new Event('workspaceDeleted'));
        navigate('/dashboard');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete workspace');
    }
  };

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
        <p className="font-bold text-sm">Workspace Error</p>
        <p className="text-xs mt-1">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 glass-btn-primary py-1.5 px-4 text-xs">
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Check workspace permissions
  const workspaceMemberObj = workspace?.members.find(
    (m) => m.user._id.toString() === user?._id.toString()
  );
  const isWorkspaceAdmin = workspaceMemberObj?.role === 'admin' || workspace?.owner._id.toString() === user?._id.toString();
  const isWorkspaceOwner = workspace?.owner._id.toString() === user?._id.toString();

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/40 border border-white/5">
        <div>
          <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 rounded-md">
            Active Workspace
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight mt-3">
            {workspace?.name}
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1.5 max-w-xl">
            {workspace?.description || 'No description provided.'}
          </p>
        </div>

        {isWorkspaceOwner && (
          <button
            onClick={handleDeleteWorkspace}
            className="glass-btn-danger text-xs flex items-center gap-1.5 py-2 px-4"
          >
            <Trash2 size={14} /> Delete Workspace
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Projects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Briefcase size={16} className="text-brand-400" /> Projects list
            </h2>
            {isWorkspaceAdmin && (
              <button
                onClick={() => setProjectModalOpen(true)}
                className="glass-btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <Plus size={14} /> Add Project
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.length === 0 ? (
              <div className="col-span-2 glass-card py-12 text-center border border-dashed border-white/10">
                <FolderKanban size={32} className="text-slate-600 mb-2 mx-auto" />
                <p className="text-sm text-slate-400 font-semibold">No Projects Yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Projects store Kanban boards, tasks, and real-time project rooms.
                </p>
              </div>
            ) : (
              projects.map((proj) => (
                <Link
                  key={proj._id}
                  to={`/projects/${proj._id}`}
                  className="glass-card glass-card-hover p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-sm font-bold text-slate-200 truncate max-w-[150px]">
                        {proj.name}
                      </h3>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                        proj.status === 'completed'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : proj.status === 'active'
                          ? 'bg-brand-500/10 border-brand-500/20 text-brand-400'
                          : 'bg-slate-800 border-white/5 text-slate-400'
                      }`}>
                        {proj.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                      {proj.description || 'No description.'}
                    </p>
                  </div>

                  <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-4 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1 capitalize">
                      Priority: <strong className={proj.priority === 'high' ? 'text-red-400' : proj.priority === 'medium' ? 'text-yellow-400' : 'text-slate-400'}>{proj.priority}</strong>
                    </span>
                    <span>{proj.members.length} Members</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Column: Workspace Members & Invitations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Users size={16} className="text-indigo-400" /> Members
            </h2>
            {isWorkspaceAdmin && (
              <button
                onClick={() => setInviteModalOpen(true)}
                className="glass-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <UserPlus size={14} /> Invite
              </button>
            )}
          </div>

          <div className="glass-card p-4 space-y-4">
            {workspace?.members.map((member) => {
              const isMemberSelf = member.user._id.toString() === user?._id.toString();
              const isMemberOwner = workspace.owner._id.toString() === member.user._id.toString();
              return (
                <div key={member.user._id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2.5 truncate">
                    {member.user.avatar ? (
                      <img
                        src={member.user.avatar}
                        alt={member.user.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white font-bold text-xs uppercase flex-shrink-0">
                        {member.user.name.charAt(0)}
                      </div>
                    )}
                    <div className="truncate">
                      <p className="font-semibold text-slate-200 truncate">{member.user.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{member.user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Role switcher for Admin on others, otherwise static text badge */}
                    {isWorkspaceOwner && !isMemberOwner ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.user._id, e.target.value)}
                        className="bg-slate-950 border border-white/10 rounded px-2 py-0.5 text-[10px] font-bold text-slate-300 focus:outline-none"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="member">Member</option>
                      </select>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 capitalize px-2 py-0.5 rounded bg-white/5">
                        {isMemberOwner ? 'Owner' : member.role}
                      </span>
                    )}

                    {/* Delete button (If admin on others, or self removal) */}
                    {((isWorkspaceAdmin && !isMemberOwner && !isMemberSelf) || (isMemberSelf && !isMemberOwner)) && (
                      <button
                        onClick={() => handleRemoveMember(member.user._id)}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-white/5 transition-all"
                        title={isMemberSelf ? 'Leave Workspace' : 'Remove Member'}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL 1: Create Project */}
      {projectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-6 relative animate-fadeIn">
            <button
              onClick={() => setProjectModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-4">Create New Project</h3>
            {projectError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-xs text-red-200">
                {projectError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Roadmap, Redesign App"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full glass-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Goals and milestones..."
                  rows={3}
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className="w-full glass-input resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Priority
                  </label>
                  <select
                    value={projectPriority}
                    onChange={(e) => setProjectPriority(e.target.value)}
                    className="w-full glass-input text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={projectDueDate}
                    onChange={(e) => setProjectDueDate(e.target.value)}
                    className="w-full glass-input text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setProjectModalOpen(false)}
                  className="glass-btn-secondary py-2 px-4 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glass-btn-primary py-2 px-4 text-sm"
                  disabled={projectLoading}
                >
                  {projectLoading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Invite Member */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-6 relative animate-fadeIn">
            <button
              onClick={() => setInviteModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Mail size={18} className="text-brand-400" />
              Invite Team Member
            </h3>

            {inviteSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-300">
                {inviteSuccess}
              </div>
            )}

            {inviteError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-xs text-red-200">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="colleague@taskflow.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full glass-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Workspace Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full glass-input text-sm"
                >
                  <option value="member">Member (Can view/comment)</option>
                  <option value="manager">Manager (Can manage projects)</option>
                  <option value="admin">Admin (Full controls)</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setInviteModalOpen(false);
                    setInviteSuccess('');
                    setInviteError('');
                  }}
                  className="glass-btn-secondary py-2 px-4 text-sm"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="glass-btn-primary py-2 px-4 text-sm"
                  disabled={inviteLoading}
                >
                  {inviteLoading ? 'Sending...' : 'Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspacePage;
