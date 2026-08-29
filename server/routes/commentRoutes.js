const express = require('express');
const router = express.Router();
const {
  createComment,
  getCommentsByTask,
  updateComment,
  deleteComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/task/:taskId')
  .post(createComment)
  .get(getCommentsByTask);

router.route('/:id')
  .put(updateComment)
  .delete(deleteComment);

module.exports = router;
