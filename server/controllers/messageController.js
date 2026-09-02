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
