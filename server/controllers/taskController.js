const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');
const { uploadToCloudinary } = require('../services/cloudinaryService');

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, projectId, assignedTo, priority, dueDate } = req.body;

    if (!title || !projectId) {
      res.status(400);
      throw new Error('Please add a task title and project ID');
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // User must be a member of the project to create tasks
    const isMember = project.members.some(
      (mId) => mId.toString() === req.user._id.toString()
    );

    if (!isMember && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to create tasks in this project');
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      priority: priority || 'medium',
      dueDate: dueDate || null
    });

    // Create notification if assigned to another user
    if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: assignedTo,
        sender: req.user._id,
        type: 'task_assigned',
        message: `You have been assigned a new task: "${title}" by ${req.user.name}`,
        relatedProject: projectId,
        relatedTask: task._id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tasks in a project with filtering/searching
// @route   GET /api/tasks/project/:projectId
// @access  Private
exports.getTasksByProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Verify membership
    const isMember = project.members.some(
      (mId) => mId.toString() === req.user._id.toString()
    );

    if (!isMember && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to access tasks in this project');
    }

    const { search, status, priority, assignedTo, dueDate } = req.query;
    const query = { project: req.params.projectId };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo === 'unassigned' ? null : assignedTo;

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Due date filter presets
    if (dueDate) {
      const now = new Date();
      if (dueDate === 'overdue') {
        query.dueDate = { $lt: now };
        query.status = { $ne: 'completed' };
      } else if (dueDate === 'today') {
        const start = new Date();
        start.setHours(0,0,0,0);
        const end = new Date();
        end.setHours(23,59,59,999);
        query.dueDate = { $gte: start, $lte: end };
      } else if (dueDate === 'week') {
        const endOfWeek = new Date();
        endOfWeek.setDate(now.getDate() + 7);
        query.dueDate = { $gte: now, $lte: endOfWeek };
      }
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get task details by ID
// @route   GET /api/tasks/:id
// @access  Private
exports.getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate({
        path: 'project',
        select: 'name members workspace'
      });

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    // Verify workspace membership
    const project = await Project.findById(task.project._id);
    const isMember = project && project.members.some(
      (mId) => mId.toString() === req.user._id.toString()
    );

    if (!isMember && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to access this task');
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
  try {
    const { title, description, assignedTo, priority, status, dueDate } = req.body;

    let task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    const project = await Project.findById(task.project);
    const isMember = project && project.members.some(
      (mId) => mId.toString() === req.user._id.toString()
    );

    if (!isMember && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to update tasks in this project');
    }

    const oldAssignee = task.assignedTo;
    const oldStatus = task.status;

    // Build update object
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate || null;

    task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Create notifications for assignments / status updates
    if (assignedTo && assignedTo.toString() !== req.user._id.toString() && (!oldAssignee || oldAssignee.toString() !== assignedTo.toString())) {
      await Notification.create({
        recipient: assignedTo,
        sender: req.user._id,
        type: 'task_assigned',
        message: `You have been assigned a task: "${task.title}" by ${req.user.name}`,
        relatedProject: task.project,
        relatedTask: task._id
      });
    }

    if (status && oldStatus !== status && task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: task.assignedTo,
        sender: req.user._id,
        type: 'status_changed',
        message: `Task status for "${task.title}" was updated from "${oldStatus}" to "${status}" by ${req.user.name}`,
        relatedProject: task.project,
        relatedTask: task._id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task status (Kanban move)
// @route   PATCH /api/tasks/:id/status
// @access  Private
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !['todo', 'in-progress', 'review', 'completed'].includes(status)) {
      res.status(400);
      throw new Error('Please provide a valid status');
    }

    let task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    const project = await Project.findById(task.project);
    const isMember = project && project.members.some(
      (mId) => mId.toString() === req.user._id.toString()
    );

    if (!isMember && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to update task status');
    }

    const oldStatus = task.status;
    task.status = status;
    await task.save();

    // Notify assignee if status changed by someone else
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: task.assignedTo,
        sender: req.user._id,
        type: 'status_changed',
        message: `Task "${task.title}" status changed to "${status}" by ${req.user.name}`,
        relatedProject: task.project,
        relatedTask: task._id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    const project = await Project.findById(task.project);
    
    // Authorization: Must be task creator, project owner, workspace admin or system manager/admin
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isProjectOwner = project && project.owner.toString() === req.user._id.toString();

    if (!isCreator && !isProjectOwner && req.user.role === 'member') {
      res.status(403);
      throw new Error('Not authorized to delete this task');
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload attachment to task
// @route   POST /api/tasks/:id/attachments
// @access  Private
exports.uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please select a file to upload');
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      // Clean up uploaded file if task doesn't exist
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(404);
      throw new Error('Task not found');
    }

    // Verify project membership
    const project = await Project.findById(task.project);
    const isMember = project && project.members.some(
      (mId) => mId.toString() === req.user._id.toString()
    );

    if (!isMember && req.user.role !== 'admin') {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(403);
      throw new Error('Not authorized to upload files to this task');
    }

    // Attempt Cloudinary upload
    const cloudResult = await uploadToCloudinary(req.file.path);

    let fileUrl = '';
    let publicId = '';

    if (cloudResult) {
      fileUrl = cloudResult.url;
      publicId = cloudResult.publicId;
    } else {
      // Local fallback: build a relative URL that we serve via express.static
      fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      publicId = req.file.filename; // Use local filename as reference for deletions
    }

    const newAttachment = {
      filename: req.file.originalname,
      url: fileUrl,
      publicId: publicId,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };

    task.attachments.push(newAttachment);
    await task.save();

    res.status(200).json({
      success: true,
      message: 'File attached successfully',
      data: task.attachments[task.attachments.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete attachment from task
// @route   DELETE /api/tasks/:id/attachments/:attachmentId
// @access  Private
exports.deleteAttachment = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    // Check project membership
    const project = await Project.findById(task.project);
    const isMember = project && project.members.some(
      (mId) => mId.toString() === req.user._id.toString()
    );

    if (!isMember && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to delete files from this task');
    }

    // Find attachment
    const attachment = task.attachments.id(req.params.attachmentId);
    if (!attachment) {
      res.status(404);
      throw new Error('Attachment not found');
    }

    // Verify creator or project manager/admin role
    const isUploader = attachment.uploadedBy.toString() === req.user._id.toString();
    const isProjectOwner = project && project.owner.toString() === req.user._id.toString();

    if (!isUploader && !isProjectOwner && req.user.role === 'member') {
      res.status(403);
      throw new Error('Not authorized to delete this attachment');
    }

    // Delete physically if local file
    const isCloudinary = attachment.url.includes('cloudinary.com');
    if (isCloudinary) {
      // Cloudinary deletion can be integrated here, but for now we delete it from DB.
      // E.g. using cloudinary.uploader.destroy(attachment.publicId)
    } else {
      const localFilePath = path.join(__dirname, '../uploads', attachment.publicId);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    }

    // Remove from array
    task.attachments.pull(req.params.attachmentId);
    await task.save();

    res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
