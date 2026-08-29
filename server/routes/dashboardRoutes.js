const express = require('express');
const router = express.Router();
const {
  getUserDashboard,
  getAdminDashboard
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getUserDashboard);

router.route('/admin')
  .get(authorize('admin'), getAdminDashboard);

module.exports = router;
