const Project = require('../models/Project');
const Workspace = require('../models/Workspace');
const User = require('../models/User');

// @desc    Create project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res, next) => {
  try {
    const { name, description, workspaceId, priority, startDate, dueDate, members } = req.body;

    if (!name || !workspaceId) {
      res.status(400);
      throw new Error('Please add a project name and workspace ID');
    }

    // Verify workspace exists
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      res.status(404);
      throw new Error('Workspace not found');
    }

    // Authorization: User must be a member of the workspace to create a project
    const memberObj = workspace.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );

    const isWorkspaceAdminOrManager = memberObj && ['admin', 'manager'].includes(memberObj.role);
    const isOwner = workspace.owner.toString() === req.user._id.toString();

    // Check system-wide role or workspace permissions
    if (!isOwner && !isWorkspaceAdminOrManager && req.user.role === 'member') {
      res.status(403);
      throw new Error('Only Workspace Admins/Managers or system Managers/Admins can create projects');
    }

    // Initialize project members with owner/creator
    let projectMembers = [req.user._id];
    if (members && Array.isArray(members)) {
      // Filter members to only those who belong to the workspace
      const workspaceUserIds = workspace.members.map(m => m.user.toString());
      const filteredMembers = members.filter(id => workspaceUserIds.includes(id.toString()));
      projectMembers = Array.from(new Set([...projectMembers, ...filteredMembers]));
    }

    const project = await Project.create({
      name,
      description,
      workspace: workspaceId,
      owner: req.user._id,
      members: projectMembers,
      priority: priority || 'medium',
      startDate,
      dueDate
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects in a workspace
// @route   GET /api/projects/workspace/:workspaceId
// @access  Private
exports.getProjectsByWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
      res.status(404);
      throw new Error('Workspace not found');
    }

    // Verify membership
    const isMember = workspace.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!isMember && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to access projects in this workspace');
    }

    // Find projects (if system admin/manager, show all. If normal member, only show projects they are a member of? Or show all workspace projects? Let's show all projects in workspace for workspace members, as it's a shared workspace, but they can only interact based on roles. This matches most collaboration tools).
    const projects = await Project.find({ workspace: req.params.workspaceId })
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar role');

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project details by ID
// @route   GET /api/projects/:id
// @access  Private
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar role')
      .populate('workspace', 'name owner');

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Check workspace membership
    const workspace = await Workspace.findById(project.workspace._id);
    const isWorkspaceMember = workspace && workspace.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!isWorkspaceMember && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to access this project');
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res, next) => {
  try {
    const { name, description, status, priority, startDate, dueDate } = req.body;

    let project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Verify permission
    const isOwner = project.owner.toString() === req.user._id.toString();
    
    // Check if workspace admin/manager
    const workspace = await Workspace.findById(project.workspace);
    const memberObj = workspace && workspace.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    const isWorkspaceAdminOrManager = memberObj && ['admin', 'manager'].includes(memberObj.role);

    if (!isOwner && !isWorkspaceAdminOrManager && req.user.role === 'member') {
      res.status(403);
      throw new Error('Not authorized to update this project');
    }

    project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          description,
          status,
          priority,
          startDate,
          dueDate
        }
      },
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar role')
      .populate('workspace', 'name owner');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Verify permission (Owner or Workspace owner/admin)
    const isOwner = project.owner.toString() === req.user._id.toString();
    const workspace = await Workspace.findById(project.workspace);
    const memberObj = workspace && workspace.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    const isWorkspaceAdmin = memberObj && memberObj.role === 'admin';

    if (!isOwner && !isWorkspaceAdmin && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to delete this project');
    }

    // Delete project tasks first (Optional clean database action)
    // await Task.deleteMany({ project: project._id });

    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private
exports.addProjectMember = async (req, res, next) => {
  try {
    const { userId, userIds } = req.body;

    if (!userId && (!userIds || !Array.isArray(userIds) || userIds.length === 0)) {
      res.status(400);
      throw new Error('Please provide user ID or user IDs to add');
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Verify permission
    const isOwner = project.owner.toString() === req.user._id.toString();
    const workspace = await Workspace.findById(project.workspace);
    const memberObj = workspace && workspace.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    const isWorkspaceAdminOrManager = memberObj && ['admin', 'manager'].includes(memberObj.role);

    if (!isOwner && !isWorkspaceAdminOrManager && req.user.role === 'member') {
      res.status(403);
      throw new Error('Not authorized to add members to this project');
    }

    const idsToAdd = userIds || [userId];
    const validIdsToAdd = [];

    for (const id of idsToAdd) {
      // Check if the user is a member of the workspace first
      const isUserInWorkspace = workspace.members.some(
        (m) => m.user.toString() === id.toString()
      );

      if (!isUserInWorkspace) {
        continue;
      }

      // Check if already in project
      const alreadyMember = project.members.some(
        (mId) => mId.toString() === id.toString()
      );

      if (alreadyMember) {
        continue;
      }

      validIdsToAdd.push(id);
    }

    if (validIdsToAdd.length === 0) {
      res.status(400);
      throw new Error('No valid new members to add (users may not be in workspace or are already in project)');
    }

    project.members.push(...validIdsToAdd);
    await project.save();

    const populatedProject = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar role')
      .populate('workspace', 'name owner');

    res.status(200).json({
      success: true,
      message: 'Project member(s) added successfully',
      data: populatedProject
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private
exports.removeProjectMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    const targetUserId = req.params.userId;

    // Verify permission
    const isOwner = project.owner.toString() === req.user._id.toString();
    const workspace = await Workspace.findById(project.workspace);
    const memberObj = workspace && workspace.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    const isWorkspaceAdminOrManager = memberObj && ['admin', 'manager'].includes(memberObj.role);
    const isSelfRemoval = req.user._id.toString() === targetUserId;

    if (!isOwner && !isWorkspaceAdminOrManager && !isSelfRemoval && req.user.role === 'member') {
      res.status(403);
      throw new Error('Not authorized to remove project members');
    }

    if (project.owner.toString() === targetUserId) {
      res.status(400);
      throw new Error('Project owner cannot be removed');
    }

    project.members = project.members.filter(
      (mId) => mId.toString() !== targetUserId
    );

    await project.save();

    const populatedProject = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar role')
      .populate('workspace', 'name owner');

    res.status(200).json({
      success: true,
      message: 'Project member removed successfully',
      data: populatedProject
    });
  } catch (error) {
    next(error);
  }
};
