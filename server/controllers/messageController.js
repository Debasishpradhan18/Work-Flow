const Message = require('../models/Message');
const Project = require('../models/Project');
const { isAuthorizedForProject } = require('../middleware/auth');

// @desc    Get all chat messages for a project
// @route   GET /api/messages/project/:projectId
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const project = await Project.findById(projectId);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Verify project authorization
    const authorized = await isAuthorizedForProject(project, req.user);
    if (!authorized) {
      res.status(403);
      throw new Error('Not authorized to access chat messages for this project');
    }

    // Fetch last 100 messages, sorted oldest to newest for chronological chat
    const messages = await Message.find({ project: projectId })
      .populate('sender', 'name email avatar role')
      .sort({ createdAt: -1 })
      .limit(100);

    // Reverse to show oldest first in UI
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages.reverse()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all chat messages for a project
// @route   DELETE /api/messages/project/:projectId
// @access  Private (Managers/Admins/Project Owner)
exports.clearProjectMessages = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const project = await Project.findById(projectId);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    const isSysAdmin = req.user.role === 'admin';
    const isProjectOwner = (project.owner?._id || project.owner).toString() === req.user._id.toString();

    let isWsAdminOrManager = false;
    if (project.workspace) {
      const Workspace = require('../models/Workspace');
      const workspace = await Workspace.findById(project.workspace);
      if (workspace) {
        if (workspace.owner.toString() === req.user._id.toString()) isWsAdminOrManager = true;
        const wsMember = workspace.members.find(
          (m) => (m.user?._id || m.user).toString() === req.user._id.toString()
        );
        if (wsMember && ['admin', 'manager'].includes(wsMember.role)) {
          isWsAdminOrManager = true;
        }
      }
    }

    if (!isSysAdmin && !isProjectOwner && !isWsAdminOrManager) {
      res.status(403);
      throw new Error('Only project owners, workspace managers, or admins can clear chat messages');
    }

    await Message.deleteMany({ project: projectId });

    res.status(200).json({
      success: true,
      message: 'Project chat messages cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};
