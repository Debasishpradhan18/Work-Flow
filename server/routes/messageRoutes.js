const express = require('express');
const router = express.Router();
const { getMessages, clearProjectMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/project/:projectId')
  .get(getMessages)
  .delete(clearProjectMessages);

module.exports = router;
