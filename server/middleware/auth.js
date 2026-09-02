const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes middleware - verifies JWT token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Token is missing.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from DB, exclude password
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No user found with this token.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This user account has been deactivated.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Invalid token.'
    });
  }
};

// Role authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. User context not set.'
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to perform this action.`
      });
    }
    next();
  };
};

// Check if user is authorized for a project (direct member, project owner, or member/admin/owner of the parent workspace)
const isAuthorizedForProject = async (project, user) => {
  if (!project || !user) return false;

  // System admin has full access
  if (user.role === 'admin') return true;

  // Project owner has full access
  const projectOwnerId = project.owner?._id || project.owner;
  if (projectOwnerId && projectOwnerId.toString() === user._id.toString()) {
    return true;
  }

  // Direct project member
  if (project.members && project.members.some((mId) => (mId._id || mId).toString() === user._id.toString())) {
    return true;
  }

  // Workspace member (owner, admin, manager, or member of the project's workspace)
  const workspaceId = project.workspace?._id || project.workspace;
  if (workspaceId) {
    const Workspace = require('../models/Workspace');
    const workspace = await Workspace.findById(workspaceId);
    if (workspace) {
      if (workspace.owner && workspace.owner.toString() === user._id.toString()) return true;
      const isWsMember = workspace.members && workspace.members.some(
        (m) => (m.user?._id || m.user).toString() === user._id.toString()
      );
      if (isWsMember) return true;
    }
  }

  return false;
};

module.exports = { protect, authorize, isAuthorizedForProject };
