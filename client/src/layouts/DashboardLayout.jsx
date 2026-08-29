import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import CreateWorkspaceModal from '../components/CreateWorkspaceModal';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Dynamic navbar title resolution based on current URL path
  const getNavbarTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/workspaces/')) return 'Workspace View';
    if (path.startsWith('/projects/')) return 'Project Workspace';
    if (path === '/profile') return 'My Profile settings';
    if (path === '/admin') return 'System Administration';
    return 'TaskFlow Dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        onCreateWorkspaceClick={() => setWorkspaceModalOpen(true)}
      />

      {/* Main container */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Navbar */}
        <Navbar toggleSidebar={toggleSidebar} title={getNavbarTitle()} />

        {/* Content Body */}
        <main className="flex-1 pt-16 p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={workspaceModalOpen}
        onClose={() => setWorkspaceModalOpen(false)}
      />
    </div>
  );
};

export default DashboardLayout;
