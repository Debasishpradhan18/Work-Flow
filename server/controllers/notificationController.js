const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({
      $or: [
        { recipient: userId },
        { recipient: userId.toString() }
      ]
    })
      .populate('sender', 'name email avatar')
      .populate('relatedProject', 'name')
      .populate('relatedTask', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    let notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(200).json({
        success: true,
        message: 'Notification not found or already read'
      });
    }

    // Check ownership
    if (notification.recipient.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to access this notification');
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany(
      {
        $or: [
          { recipient: userId },
          { recipient: userId.toString() }
        ],
        isRead: false
      },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear / Delete all notifications for current user
// @route   DELETE /api/notifications/clear-all
// @access  Private
exports.clearAllNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const result = await Notification.deleteMany({
      $or: [
        { recipient: userId },
        { recipient: userId.toString() }
      ]
    });

    res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: 'All notifications cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete single notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(200).json({
        success: true,
        message: 'Notification already deleted'
      });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this notification');
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
