import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  KanbanSquare,
  MessageSquare,
  Settings,
  Plus,
  Trash2,
  Calendar,
  X,
  Send,
  Paperclip,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Edit,
  Trash
} from 'lucide-react';

const ProjectPage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  // Active Tab
  const [activeTab, setActiveTab] = useState('board'); // board, chat, settings

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Workspace members for settings dropdown
  const [workspaceMembers, setWorkspaceMembers] = useState([]);

  // Socket status sync notifications
  const [socketNotification, setSocketNotification] = useState(null);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const chatBottomRef = useRef(null);

  // Task Creation Modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskError, setTaskError] = useState('');
  const [taskLoading, setTaskLoading] = useState(false);

  // Selected Task Details Modal state
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [detailDescEditing, setDetailDescEditing] = useState(false);
  const [detailDesc, setDetailDesc] = useState('');
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);

  // Fetch Project details, tasks, and history
  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const projResponse = await api.get(`/projects/${projectId}`);
      if (projResponse.data.success) {
        setProject(projResponse.data.data);
        
        // Load parent workspace members to allow inviting them to project
        const wsResponse = await api.get(`/workspaces/${projResponse.data.data.workspace._id}`);
        if (wsResponse.data.success) {
          setWorkspaceMembers(wsResponse.data.data.members);
        }
      }

      // Load tasks
      const tasksResponse = await api.get(`/tasks/project/${projectId}`);
      if (tasksResponse.data.success) {
        setTasks(tasksResponse.data.data);
      }

      // Load chat messages
      const msgsResponse = await api.get(`/messages/project/${projectId}`);
      if (msgsResponse.data.success) {
        setMessages(msgsResponse.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  // Tab navigation from routing
  useEffect(() => {
    if (location.pathname.endsWith('/chat')) {
      setActiveTab('chat');
    } else if (location.pathname.endsWith('/board')) {
      setActiveTab('board');
    }
  }, [location]);

  // Socket joining room & listeners
  useEffect(() => {
    if (socket && project) {
      socket.emit('join_project', projectId);

      // Listen for chat messages
      socket.on('new_message', (msg) => {
        setMessages((prev) => [...prev, msg]);
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      });

      // Listen for Kanban drag and drop moves from other team members
      socket.on('task_status_updated', (data) => {
        const { taskId, title, fromStatus, toStatus, userName } = data;
        
        // Update task status in local state
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? { ...t, status: toStatus } : t))
        );

        // Flash temporary real-time alert
        setSocketNotification(`${userName} moved "${title}" to ${toStatus}`);
        setTimeout(() => setSocketNotification(null), 5000);
      });
    }

    return () => {
      if (socket) {
        socket.emit('leave_project', projectId);
        socket.off('new_message');
        socket.off('task_status_updated');
      }
    };
  }, [socket, project, projectId]);

  // Scroll chat to bottom when entering chat tab or loading messages
  useEffect(() => {
    if (activeTab === 'chat') {
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [activeTab, messages]);

  // Check URL query parameters for task details modal trigger
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const taskIdParam = params.get('task');
    if (taskIdParam && tasks.length > 0) {
      const task = tasks.find(t => t._id === taskIdParam);
      if (task) {
        handleOpenTaskDetail(task);
      }
    }
  }, [location.search, tasks]);

  // Handle Chat message sending
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !socket) return;

    socket.emit('send_message', {
      senderId: user._id,
      projectId,
      message: newMessageText.trim()
    });

    setNewMessageText('');
  };

  // Kanban Drag and Drop logic (HTML5 Native Drag and Drop)
  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('text/plain', task._id);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find((t) => t._id === taskId);

    if (!task || task.status === targetStatus) return;

    const originalStatus = task.status;

    // 1. Instant UI update (optimistic UI)
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: targetStatus } : t))
    );

    try {
      // 2. HTTP PUT PATCH API call to persist
      const response = await api.patch(`/tasks/${taskId}/status`, {
        status: targetStatus
      });

      if (response.data.success) {
        // 3. Emit socket event to update everyone else
        if (socket) {
          socket.emit('task_moved', {
            projectId,
            taskId,
            title: task.title,
            fromStatus: originalStatus,
            toStatus: targetStatus,
            userName: user.name
          });
        }
      }
    } catch (err) {
      // Revert local state on error
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: originalStatus } : t))
      );
      alert(err.response?.data?.message || 'Failed to update task status');
    }
  };

  // Task creation handler
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setTaskError('Task title is required');
      return;
    }

    setTaskLoading(true);
    setTaskError('');

    try {
      const response = await api.post('/tasks', {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        projectId,
        assignedTo: taskAssignee || null,
        priority: taskPriority,
        dueDate: taskDueDate || null
      });

      if (response.data.success) {
        setTaskTitle('');
        setTaskDesc('');
        setTaskAssignee('');
        setTaskPriority('medium');
        setTaskDueDate('');
        setTaskModalOpen(false);
        // Refresh tasks
        fetchProjectData();
      }
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setTaskLoading(false);
    }
  };

  // Task Details Modal triggers
  const handleOpenTaskDetail = async (task) => {
    setSelectedTask(task);
    setDetailDesc(task.description || '');
    setDetailDescEditing(false);
    setIsTaskDetailOpen(true);

    // Update query params
    navigate(`?task=${task._id}`, { replace: true });

    // Fetch comments
    try {
      const response = await api.get(`/comments/task/${task._id}`);
      if (response.data.success) {
        setComments(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load comments:', err.message);
    }
  };

  const handleCloseTaskDetail = () => {
    setIsTaskDetailOpen(false);
    setSelectedTask(null);
    setComments([]);
    // Remove query params
    navigate('', { replace: true });
  };

  const handleUpdateTaskDetail = async (updatedFields) => {
    try {
      const response = await api.put(`/tasks/${selectedTask._id}`, updatedFields);
      if (response.data.success) {
        // Refresh task list
        const updatedTask = response.data.data;
        setTasks((prev) =>
          prev.map((t) => (t._id === selectedTask._id ? { ...t, ...updatedTask } : t))
        );
        setSelectedTask((prev) => ({ ...prev, ...updatedTask }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleSaveDescription = async () => {
    await handleUpdateTaskDetail({ description: detailDesc.trim() });
    setDetailDescEditing(false);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const response = await api.delete(`/tasks/${taskId}`);
      if (response.data.success) {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
        if (isTaskDetailOpen) {
          handleCloseTaskDetail();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  // Comments handlers
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      const response = await api.post(`/comments/task/${selectedTask._id}`, {
        content: newCommentText.trim()
      });

      if (response.data.success) {
        setComments((prev) => [...prev, response.data.data]);
        setNewCommentText('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await api.delete(`/comments/${commentId}`);
      if (response.data.success) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  // Attachment upload handler
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!fileToUpload) return;

    setFileUploading(true);
    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const response = await api.post(`/tasks/${selectedTask._id}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        // Append attachment locally
        const newAttachObj = response.data.data;
        setSelectedTask(prev => {
          const updatedAttachments = [...prev.attachments, newAttachObj];
          // Update tasks list
          setTasks(tPrev => tPrev.map(t => t._id === prev._id ? { ...t, attachments: updatedAttachments } : t));
          return { ...prev, attachments: updatedAttachments };
        });
        setFileToUpload(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload attachment');
    } finally {
      setFileUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      const response = await api.delete(`/tasks/${selectedTask._id}/attachments/${attachmentId}`);
      if (response.data.success) {
        setSelectedTask(prev => {
          const updatedAttachments = prev.attachments.filter(a => a._id !== attachmentId);
          setTasks(tPrev => tPrev.map(t => t._id === prev._id ? { ...t, attachments: updatedAttachments } : t));
          return { ...prev, attachments: updatedAttachments };
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove attachment');
    }
  };

  // Add Project members (from Workspace users list)
  const handleAddProjectMember = async (userId) => {
    try {
      const response = await api.post(`/projects/${projectId}/members`, { userId });
      if (response.data.success) {
        setProject(response.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add project member');
    }
  };

  const handleRemoveProjectMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member from the project?')) return;
    try {
      const response = await api.delete(`/projects/${projectId}/members/${userId}`);
      if (response.data.success) {
        setProject(response.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove project member');
    }
  };

  const handleUpdateProjectSettings = async (fields) => {
    try {
      const response = await api.put(`/projects/${projectId}`, fields);
      if (response.data.success) {
        setProject(prev => ({ ...prev, ...response.data.data }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update project settings');
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
        <p className="font-bold text-sm">Project Loading Error</p>
        <p className="text-xs mt-1">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 glass-btn-primary py-1.5 px-4 text-xs">
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Kanban column categories
  const COLUMNS = [
    { id: 'todo', title: 'To Do', color: 'border-t-blue-500' },
    { id: 'in-progress', title: 'In Progress', color: 'border-t-amber-500' },
    { id: 'review', title: 'Review', color: 'border-t-purple-500' },
    { id: 'completed', title: 'Completed', color: 'border-t-emerald-500' }
  ];

  // Filters for project settings member dropdown (workspace members not in project)
  const candidateMembers = workspaceMembers.filter(
    (wm) => !project?.members.some((pm) => pm._id.toString() === wm.user._id.toString())
  );

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)]">
      {/* Socket Alert popup */}
      {socketNotification && (
        <div className="fixed bottom-4 right-4 z-50 p-4 rounded-xl bg-slate-900 border border-brand-500/30 text-xs text-brand-300 shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={16} className="text-brand-500" />
          <span>{socketNotification}</span>
        </div>
      )}

      {/* Project Header & Tab list */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/20 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight">{project?.name}</h1>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">
            Status: <strong className="uppercase text-brand-400">{project?.status}</strong> &bull; Priority: <strong className="capitalize text-slate-300">{project?.priority}</strong>
          </p>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'board' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KanbanSquare size={14} />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'chat' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare size={14} />
            <span>Project Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'settings' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings size={14} />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Main Tab Panels */}
      <div className="flex-1 min-h-0">
        {/* TAB 1: Kanban Board */}
        {activeTab === 'board' && (
          <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Kanban Workspace
              </h2>
              <button
                onClick={() => setTaskModalOpen(true)}
                className="glass-btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
              >
                <Plus size={14} /> Create Task
              </button>
            </div>

            {/* Board Columns */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-y-auto pb-4 align-top">
              {COLUMNS.map((col) => {
                const columnTasks = tasks.filter((t) => t.status === col.id);
                return (
                  <div
                    key={col.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className="flex flex-col h-full rounded-2xl bg-slate-900/20 border border-white/5 overflow-hidden"
                  >
                    {/* Column Header */}
                    <div className={`p-3 bg-slate-900/60 border-t-2 ${col.color} border-b border-white/5 flex items-center justify-between`}>
                      <span className="text-xs font-bold text-slate-300">{col.title}</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                        {columnTasks.length}
                      </span>
                    </div>

                    {/* Column Body / Cards List */}
                    <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-23rem)]">
                      {columnTasks.length === 0 ? (
                        <div className="h-full flex items-center justify-center border border-dashed border-white/5 rounded-xl py-8 text-[10px] text-slate-600">
                          Drop tasks here
                        </div>
                      ) : (
                        columnTasks.map((t) => (
                          <div
                            key={t._id}
                            draggable="true"
                            onDragStart={(e) => handleDragStart(e, t)}
                            onClick={() => handleOpenTaskDetail(t)}
                            className="glass-card p-3 rounded-xl cursor-pointer hover:border-white/20 active:cursor-grabbing hover:scale-[1.01] transition-all"
                          >
                            <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{t.title}</h4>
                            <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                              {t.description || 'No description.'}
                            </p>

                            <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-3 text-[9px] text-slate-500">
                              <span className={`inline-block px-1.5 py-0.5 rounded border capitalize ${
                                t.priority === 'high' ? 'bg-red-950/40 border-red-500/20 text-red-400' : t.priority === 'medium' ? 'bg-yellow-950/40 border-yellow-500/20 text-yellow-400' : 'bg-slate-800 border-white/5 text-slate-400'
                              }`}>
                                {t.priority}
                              </span>

                              {t.assignedTo ? (
                                <span className="flex items-center gap-1 font-medium truncate max-w-[80px]">
                                  {t.assignedTo.name}
                                </span>
                              ) : (
                                <span className="text-slate-600 font-semibold">Unassigned</span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Project Chat Room */}
        {activeTab === 'chat' && (
          <div className="h-[calc(100vh-17rem)] flex flex-col bg-slate-900/20 border border-white/5 rounded-2xl overflow-hidden">
            {/* Socket connection indicator */}
            <div className="px-4 py-2 bg-slate-950/40 border-b border-white/5 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-semibold uppercase tracking-wider">
                Project Chat Channel
              </span>
              <span className={`flex items-center gap-1.5 ${isConnected ? 'text-emerald-400' : 'text-yellow-400 animate-pulse'}`}>
                <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-yellow-500'}`}></span>
                {isConnected ? 'Connected (Real-time enabled)' : 'Connecting socket...'}
              </span>
            </div>

            {/* Chat message logs */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600">
                  <MessageSquare size={36} className="mb-2 opacity-50" />
                  <p className="text-xs font-semibold">No messages in room</p>
                  <p className="text-[10px] opacity-75">Send a message to kickstart discussions.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMsgSelf = msg.sender._id.toString() === user?._id.toString();
                  return (
                    <div
                      key={msg._id}
                      className={`flex gap-3 max-w-[80%] ${isMsgSelf ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      {msg.sender.avatar ? (
                        <img
                          src={msg.sender.avatar}
                          alt={msg.sender.name}
                          className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 border border-white/5 font-bold text-xs uppercase flex-shrink-0">
                          {msg.sender.name.charAt(0)}
                        </div>
                      )}

                      {/* Bubble */}
                      <div className={`space-y-1 ${isMsgSelf ? 'text-right' : ''}`}>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <span className="font-bold text-slate-400">{msg.sender.name}</span>
                          <span>&bull;</span>
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed break-words text-left ${
                          isMsgSelf
                            ? 'bg-brand-600 text-white rounded-tr-none shadow-md shadow-brand-500/10'
                            : 'bg-slate-900 border border-white/5 text-slate-200 rounded-tl-none'
                        }`}>
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef}></div>
            </div>

            {/* Input box */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-950/40 border-t border-white/5 flex gap-2">
              <input
                type="text"
                placeholder="Type your project message..."
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                className="flex-1 glass-input py-2 text-xs"
                disabled={!isConnected}
              />
              <button
                type="submit"
                className="glass-btn-primary p-2 flex items-center justify-center"
                disabled={!isConnected || !newMessageText.trim()}
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: Project Settings & Members */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Project parameters edit */}
            <div className="md:col-span-2 glass-card space-y-4 h-fit">
              <h3 className="text-sm font-bold text-slate-200 pb-2 border-b border-white/5">
                Project Parameters
              </h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={project?.status}
                    onChange={(e) => handleUpdateProjectSettings({ status: e.target.value })}
                    className="w-full glass-input text-xs"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                    Priority
                  </label>
                  <select
                    value={project?.priority}
                    onChange={(e) => handleUpdateProjectSettings({ priority: e.target.value })}
                    className="w-full glass-input text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={project?.startDate ? new Date(project.startDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleUpdateProjectSettings({ startDate: e.target.value })}
                      className="w-full glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={project?.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleUpdateProjectSettings({ dueDate: e.target.value })}
                      className="w-full glass-input text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Project Members List */}
            <div className="glass-card space-y-4">
              <h3 className="text-sm font-bold text-slate-200 pb-2 border-b border-white/5">
                Project Members
              </h3>

              {/* Add member dropdown */}
              {candidateMembers.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Add Workspace Member
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddProjectMember(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2 text-xs focus:outline-none"
                  >
                    <option value="">Select teammate...</option>
                    {candidateMembers.map((m) => (
                      <option key={m.user._id} value={m.user._id}>
                        {m.user.name} ({m.user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* List */}
              <div className="space-y-3 pt-2">
                {project?.members.map((m) => {
                  const projectOwnerId = project.owner?._id || project.owner;
                  const isPMOwner = projectOwnerId?.toString() === m._id.toString();
                  return (
                    <div key={m._id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <div className="h-6 w-6 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-[10px] uppercase">
                          {m.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-300 truncate">{m.name}</span>
                      </div>

                      {!isPMOwner && (
                        <button
                          onClick={() => handleRemoveProjectMember(m._id)}
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-white/5"
                          title="Remove from Project"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Create Task */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-6 relative animate-fadeIn">
            <button
              onClick={() => setTaskModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-4">Create Project Task</h3>

            {taskError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-xs text-red-200">
                {taskError}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Design Login UI, Implement APIs"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full glass-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Steps to reproduce, checklist..."
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full glass-input resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Assignee
                  </label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {project?.members.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full glass-input text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="glass-btn-secondary py-2 px-4 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glass-btn-primary py-2 px-4 text-sm"
                  disabled={taskLoading}
                >
                  {taskLoading ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Task Details Modal (Highly interactive Jira-style) */}
      {isTaskDetailOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-6 relative animate-fadeIn flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={handleCloseTaskDetail}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
            >
              <X size={18} />
            </button>

            {/* Left Column: Title, Description, Attachments, Comments */}
            <div className="flex-1 space-y-6">
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Task ID: {selectedTask._id}
                </span>
                <h3 className="text-base font-extrabold text-slate-100 leading-tight">
                  {selectedTask.title}
                </h3>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Description
                </label>
                {detailDescEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={detailDesc}
                      onChange={(e) => setDetailDesc(e.target.value)}
                      rows={3}
                      className="w-full glass-input text-xs resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setDetailDescEditing(false)}
                        className="glass-btn-secondary py-1 px-3 text-[10px]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveDescription}
                        className="glass-btn-primary py-1 px-3 text-[10px]"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setDetailDescEditing(true)}
                    className="p-3 rounded-xl bg-slate-950/40 border border-white/5 hover:border-white/10 cursor-pointer text-xs text-slate-300 min-h-16 whitespace-pre-wrap leading-relaxed"
                  >
                    {selectedTask.description || 'Click to add a detailed description...'}
                  </div>
                )}
              </div>

              {/* Attachments */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Attachments ({selectedTask.attachments.length})
                </label>

                {/* Upload Form */}
                <form onSubmit={handleFileUpload} className="flex gap-2 items-center">
                  <input
                    type="file"
                    onChange={(e) => setFileToUpload(e.target.files[0])}
                    className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-white/5 file:text-slate-200 file:cursor-pointer hover:file:bg-white/10"
                    disabled={fileUploading}
                  />
                  {fileToUpload && (
                    <button
                      type="submit"
                      className="glass-btn-primary py-1 px-3 text-[10px] flex items-center gap-1"
                      disabled={fileUploading}
                    >
                      <Paperclip size={10} /> {fileUploading ? 'Uploading...' : 'Upload'}
                    </button>
                  )}
                </form>

                {/* Files List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedTask.attachments.map((file) => (
                    <div
                      key={file._id}
                      className="p-2.5 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-400 hover:text-brand-300 font-semibold truncate max-w-[150px]"
                        title={file.filename}
                      >
                        {file.filename}
                      </a>
                      <button
                        onClick={() => handleDeleteAttachment(file._id)}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-white/5"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments Thread */}
              <div className="space-y-3 border-t border-white/5 pt-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Comments Thread ({comments.length})
                </label>

                {/* Input box */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 glass-input py-1.5 text-xs"
                  />
                  <button
                    type="submit"
                    className="glass-btn-primary py-1.5 px-4 text-xs font-bold"
                    disabled={!newCommentText.trim()}
                  >
                    Comment
                  </button>
                </form>

                {/* Logs */}
                <div className="space-y-3 max-h-52 overflow-y-auto pr-1 pt-1">
                  {comments.map((c) => {
                    const isCommSelf = c.author._id.toString() === user?._id.toString();
                    return (
                      <div key={c._id} className="p-3 rounded-xl bg-slate-950/20 border border-white/5 relative group">
                        <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                          <span className="font-bold text-slate-400">{c.author.name}</span>
                          <span>
                            {new Date(c.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed break-words">{c.content}</p>

                        {/* Delete comment (if owner/admin/uploader) */}
                        {isCommSelf && (
                          <button
                            onClick={() => handleDeleteComment(c._id)}
                            className="absolute top-2.5 right-2.5 p-1 rounded text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete comment"
                          >
                            <Trash size={10} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Status, Priority, Assignee, Due date, Delete */}
            <div className="w-full md:w-56 space-y-4 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 text-xs text-slate-400">
              {/* Status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  value={selectedTask.status}
                  onChange={(e) => handleUpdateTaskDetail({ status: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2 text-xs focus:outline-none"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Priority
                </label>
                <select
                  value={selectedTask.priority}
                  onChange={(e) => handleUpdateTaskDetail({ priority: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2 text-xs focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Assignee
                </label>
                <select
                  value={selectedTask.assignedTo?._id || ''}
                  onChange={(e) => handleUpdateTaskDetail({ assignedTo: e.target.value || null })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2 text-xs focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {project?.members.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleUpdateTaskDetail({ dueDate: e.target.value || null })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2 text-xs focus:outline-none text-slate-300"
                />
              </div>

              {/* Creator details */}
              <div className="border-t border-white/5 pt-4 text-[10px] space-y-1 text-slate-500">
                <p>Created by: <strong>{selectedTask.createdBy.name}</strong></p>
                <p>
                  Created:{' '}
                  {new Date(selectedTask.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>

              {/* Action: Delete Task */}
              <div className="pt-2">
                <button
                  onClick={() => handleDeleteTask(selectedTask._id)}
                  className="w-full glass-btn-danger text-[10px] py-2 flex items-center justify-center gap-1"
                >
                  <Trash2 size={12} /> Delete Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPage;
