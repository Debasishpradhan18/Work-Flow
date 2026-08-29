const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  uploadAttachment,
  deleteAttachment
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.route('/')
  .post(createTask);

router.route('/project/:projectId')
  .get(getTasksByProject);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

router.route('/:id/status')
  .patch(updateTaskStatus);

// Attachments
router.route('/:id/attachments')
  .post(upload.single('file'), uploadAttachment);

router.route('/:id/attachments/:attachmentId')
  .delete(deleteAttachment);

module.exports = router;
