const Project = require('../models/Project');
const Task = require('../models/Task');
const Workspace = require('../models/Workspace');
const User = require('../models/User');

// @desc    Get user dashboard analytics
// @route   GET /api/dashboard
// @access  Private
exports.getUserDashboard = async (req, res, next) => {
  try {
    // 1. Get workspaces where user is a member
    const workspaces = await Workspace.find({ 'members.user': req.user._id });
    const workspaceIds = workspaces.map(w => w._id);

    // 2. Projects in these workspaces
    const projects = await Project.find({ workspace: { $in: workspaceIds } });
    const projectIds = projects.map(p => p._id);

    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;

    // 3. Tasks in these projects
    // For personal tasks, we show tasks assigned to the user OR created by the user in these projects
    const allTasks = await Task.find({ project: { $in: projectIds } });
    
    // Filter tasks for the user's personal view
    const userTasks = allTasks.filter(
      t => (t.assignedTo && t.assignedTo.toString() === req.user._id.toString()) || 
           t.createdBy.toString() === req.user._id.toString()
    );

    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(t => t.status === 'completed').length;
    const pendingTasks = totalTasks - completedTasks;

    // Overdue tasks: dueDate < today and not completed
    const today = new Date();
    const overdueTasks = userTasks.filter(
      t => t.dueDate && new Date(t.dueDate) < today && t.status !== 'completed'
    ).length;

    // 4. Team Members: Unique users in all user's workspaces
    const memberSet = new Set();
    workspaces.forEach(w => {
      w.members.forEach(m => {
        memberSet.add(m.user.toString());
      });
    });
    const teamMembersCount = memberSet.size;

    // 5. Tasks by Status (for Recharts)
    const tasksByStatus = [
      { name: 'To Do', value: userTasks.filter(t => t.status === 'todo').length },
      { name: 'In Progress', value: userTasks.filter(t => t.status === 'in-progress').length },
      { name: 'Review', value: userTasks.filter(t => t.status === 'review').length },
      { name: 'Completed', value: userTasks.filter(t => t.status === 'completed').length }
    ];

    // 6. Tasks by Priority (for Recharts)
    const tasksByPriority = [
      { name: 'Low', value: userTasks.filter(t => t.priority === 'low').length },
      { name: 'Medium', value: userTasks.filter(t => t.priority === 'medium').length },
      { name: 'High', value: userTasks.filter(t => t.priority === 'high').length }
    ];

    // 7. Project Progress details (for progress bars/charts)
    const projectProgress = projects.slice(0, 5).map(p => {
      const projTasks = allTasks.filter(t => t.project.toString() === p._id.toString());
      const totalProjTasks = projTasks.length;
      const completedProjTasks = projTasks.filter(t => t.status === 'completed').length;
      const progress = totalProjTasks > 0 ? Math.round((completedProjTasks / totalProjTasks) * 100) : 0;
      return {
        name: p.name,
        progress,
        tasksCount: totalProjTasks
      };
    });

    // 8. Completed tasks over last 7 days (mock historical dates based on real DB records)
    const tasksOverTime = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Count tasks completed on this day (ignoring timezone details for simple comparison)
      const count = userTasks.filter(t => {
        if (t.status !== 'completed') return false;
        const compDate = new Date(t.updatedAt);
        return compDate.getDate() === d.getDate() && 
               compDate.getMonth() === d.getMonth() && 
               compDate.getFullYear() === d.getFullYear();
      }).length;

      tasksOverTime.push({
        date: dateString,
        completed: count
      });
    }

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalProjects,
          activeProjects,
          completedProjects,
          totalTasks,
          pendingTasks,
          completedTasks,
          overdueTasks,
          teamMembersCount
        },
        charts: {
          tasksByStatus,
          tasksByPriority,
          projectProgress,
          tasksOverTime
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system-wide admin dashboard analytics
// @route   GET /api/dashboard/admin
// @access  Private/Admin
exports.getAdminDashboard = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({});
    const activeUsers = await User.countDocuments({ isActive: true });
    
    const totalWorkspaces = await Workspace.countDocuments({});
    const totalProjects = await Project.countDocuments({});
    const totalTasks = await Task.countDocuments({});

    // Project breakdown by status
    const projectsByStatus = [
      { name: 'Planning', value: await Project.countDocuments({ status: 'planning' }) },
      { name: 'Active', value: await Project.countDocuments({ status: 'active' }) },
      { name: 'On Hold', value: await Project.countDocuments({ status: 'on-hold' }) },
      { name: 'Completed', value: await Project.countDocuments({ status: 'completed' }) }
    ];

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          totalWorkspaces,
          totalProjects,
          totalTasks
        },
        charts: {
          projectsByStatus
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
