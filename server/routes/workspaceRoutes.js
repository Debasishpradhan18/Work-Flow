const express = require('express');
const router = express.Router();
const {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  addWorkspaceMember,
  removeWorkspaceMember,
  assignWorkspaceMemberRole
} = require('../controllers/workspaceController');
const { protect } = require('../middleware/auth');

// All workspace routes require protection
router.use(protect);

router.route('/')
  .post(createWorkspace)
  .get(getWorkspaces);

router.route('/:id')
  .get(getWorkspaceById)
  .put(updateWorkspace)
  .delete(deleteWorkspace);

router.route('/:id/members')
  .post(addWorkspaceMember);

router.route('/:id/members/:userId')
  .delete(removeWorkspaceMember);

router.route('/:id/members/:userId/role')
  .put(assignWorkspaceMemberRole);

module.exports = router;
