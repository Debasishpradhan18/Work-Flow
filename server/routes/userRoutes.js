const express = require('express');
const router = express.Router();
const {
  getUsers,
  getProfile,
  updateProfile,
  updatePassword,
  updateUserRole,
  toggleUserStatus
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// All routes here are protected
router.use(protect);

router.get('/', getUsers);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/profile/password', updatePassword);

// Admin-only actions
router.put('/:id/role', authorize('admin'), updateUserRole);
router.put('/:id/status', authorize('admin'), toggleUserStatus);

module.exports = router;
