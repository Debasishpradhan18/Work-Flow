const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  deleteNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getNotifications);

router.route('/read-all')
  .put(markAllAsRead);

router.route('/clear-all')
  .delete(clearAllNotifications);

router.route('/:id/read')
  .put(markAsRead);

router.route('/:id')
  .delete(deleteNotification);

module.exports = router;
