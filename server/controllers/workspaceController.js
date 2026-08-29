const Workspace = require('../models/Workspace');
const User = require('../models/User');

// @desc    Create workspace
// @route   POST /api/workspaces
// @access  Private
exports.createWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(400);
      throw new Error('Please add a workspace name');
    }

    const workspace = await Workspace.create({
      name,
      description,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'admin' // Owner is workspace admin
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Workspace created successfully',
      data: workspace
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all workspaces for logged-in user
// @route   GET /api/workspaces
// @access  Private
exports.getWorkspaces = async (req, res, next) => {
  try {
    // Find workspaces where user is in members array
    const workspaces = await Workspace.find({
      'members.user': req.user._id
    }).populate('owner', 'name email avatar');

    res.status(200).json({
      success: true,
      count: workspaces.length,
      data: workspaces
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get workspace details by ID
// @route   GET /api/workspaces/:id
// @access  Private
exports.getWorkspaceById = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar role');

    if (!workspace) {
      res.status(404);
      throw new Error('Workspace not found');
    }

    // Check membership
    const isMember = workspace.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );

    if (!isMember && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to access this workspace');
    }

    res.status(200).json({
      success: true,
      data: workspace
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update workspace
// @route   PUT /api/workspaces/:id
// @access  Private
exports.updateWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    let workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      res.status(404);
      throw new Error('Workspace not found');
    }

    // Check if user is owner or workspace admin
    const memberObj = workspace.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );

    const isAdmin = memberObj && memberObj.role === 'admin';
    const isOwner = workspace.owner.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to update this workspace');
    }

    workspace = await Workspace.findByIdAndUpdate(
      req.params.id,
      { $set: { name, description } },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Workspace updated successfully',
      data: workspace
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete workspace
// @route   DELETE /api/workspaces/:id
// @access  Private
exports.deleteWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      res.status(404);
      throw new Error('Workspace not found');
    }

    // Only owner or system-wide Admin can delete workspace
    const isOwner = workspace.owner.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to delete this workspace');
    }

    await workspace.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Workspace deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to workspace
// @route   POST /api/workspaces/:id/members
// @access  Private
exports.addWorkspaceMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Please provide user email to invite');
    }

    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      res.status(404);
      throw new Error('Workspace not found');
    }

    // Must be owner or workspace admin to add members
    const memberObj = workspace.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    const isAdmin = memberObj && memberObj.role === 'admin';
    const isOwner = workspace.owner.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to add members to this workspace');
    }

    // Find user to add
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      res.status(444); // custom code for email not found
      res.status(404);
      throw new Error('User not registered in TaskFlow');
    }

    // Check if already a member
    const alreadyMember = workspace.members.some(
      (m) => m.user.toString() === userToAdd._id.toString()
    );

    if (alreadyMember) {
      res.status(400);
      throw new Error('User is already a member of this workspace');
    }

    // Add to members array
    workspace.members.push({
      user: userToAdd._id,
      role: role || 'member'
    });

    await workspace.save();

    const populatedWorkspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar role');

    res.status(200).json({
      success: true,
      message: 'Member added successfully',
      data: populatedWorkspace
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from workspace
// @route   DELETE /api/workspaces/:id/members/:userId
// @access  Private
exports.removeWorkspaceMember = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      res.status(404);
      throw new Error('Workspace not found');
    }

    const targetUserId = req.params.userId;

    // Check permissions
    const memberObj = workspace.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    const isAdmin = memberObj && memberObj.role === 'admin';
    const isOwner = workspace.owner.toString() === req.user._id.toString();

    // User removing themselves is allowed, otherwise must be admin/owner
    const isSelfRemoval = req.user._id.toString() === targetUserId;

    if (!isOwner && !isAdmin && !isSelfRemoval && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to remove members');
    }

    // Owner cannot be removed from workspace members
    if (workspace.owner.toString() === targetUserId) {
      res.status(400);
      throw new Error('Workspace owner cannot be removed');
    }

    // Remove user
    workspace.members = workspace.members.filter(
      (m) => m.user.toString() !== targetUserId
    );

    await workspace.save();

    const populatedWorkspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar role');

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      data: populatedWorkspace
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign role to workspace member
// @route   PUT /api/workspaces/:id/members/:userId/role
// @access  Private
exports.assignWorkspaceMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role || !['admin', 'manager', 'member'].includes(role)) {
      res.status(400);
      throw new Error('Invalid workspace role');
    }

    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      res.status(404);
      throw new Error('Workspace not found');
    }

    // Must be workspace owner or system admin to assign roles
    const isOwner = workspace.owner.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Only the workspace owner can assign member roles');
    }

    const targetUserId = req.params.userId;

    if (workspace.owner.toString() === targetUserId) {
      res.status(400);
      throw new Error('Cannot change role of workspace owner');
    }

    // Update role
    const member = workspace.members.find(
      (m) => m.user.toString() === targetUserId
    );

    if (!member) {
      res.status(404);
      throw new Error('User is not a member of this workspace');
    }

    member.role = role;
    await workspace.save();

    const populatedWorkspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar role');

    res.status(200).json({
      success: true,
      message: 'Member workspace role updated successfully',
      data: populatedWorkspace
    });
  } catch (error) {
    next(error);
  }
};
