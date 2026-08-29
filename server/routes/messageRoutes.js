const express = require('express');
const router = express.Router();
const { getMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/project/:projectId')
  .get(getMessages);

module.exports = router;
