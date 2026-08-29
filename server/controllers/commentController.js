const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

// @desc    Add comment to task
// @route   POST /api/comments/task/:taskId
// @access  Private
exports.createComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const taskId = req.params.taskId;

    if (!content) {
      res.status(400);
      throw new Error('Please add a comment description');
    }

    // Verify task and project membership
    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    const project = task.project;
    const isMember = project && project.members.some(
      (mId) => mId.toString() === req.user._id.toString()
    );

    if (!isMember && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to comment on tasks in this project');
    }

    const comment = await Comment.create({
      task: taskId,
      author: req.user._id,
      content
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email avatar role');

    // Notify assignee if not the commentator
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: task.assignedTo,
        sender: req.user._id,
        type: 'new_comment',
        message: `${req.user.name} commented on your assigned task: "${task.title}"`,
        relatedProject: task.project._id,
        relatedTask: task._id
      });
    }

    // Also notify creator of the task if they are different from the commentator
    if (task.createdBy && task.createdBy.toString() !== req.user._id.toString() && (!task.assignedTo || task.assignedTo.toString() !== task.createdBy.toString())) {
      await Notification.create({
        recipient: task.createdBy,
        sender: req.user._id,
        type: 'new_comment',
        message: `${req.user.name} commented on task you created: "${task.title}"`,
        relatedProject: task.project._id,
        relatedTask: task._id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: populatedComment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
exports.updateComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    let comment = await Comment.findById(req.params.id);

    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }

    // Only creator of the comment can update it
    if (comment.author.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to edit this comment');
    }

    comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { $set: { content } },
      { new: true, runValidators: true }
    ).populate('author', 'name email avatar role');

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }

    // Authorization: comment author, system admin, task creator, or project owner
    const task = await Task.findById(comment.task).populate('project');
    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isTaskCreator = task && task.createdBy.toString() === req.user._id.toString();
    const isProjectOwner = task && task.project.owner.toString() === req.user._id.toString();

    if (!isAuthor && !isTaskCreator && !isProjectOwner && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to delete this comment');
    }

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for a task
// @route   GET /api/comments/task/:taskId
// @access  Private
exports.getCommentsByTask = async (req, res, next) => {
  try {
    const taskId = req.params.taskId;
    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    // Verify membership
    const isMember = task.project && task.project.members.some(
      (mId) => mId.toString() === req.user._id.toString()
    );

    if (!isMember && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to view comments on this task');
    }

    const comments = await Comment.find({ task: taskId })
      .populate('author', 'name email avatar role')
      .sort({ createdAt: 1 }); // Oldest first for chat-like sequence

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    next(error);
  }
};
