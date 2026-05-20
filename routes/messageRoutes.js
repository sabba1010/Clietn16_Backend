// routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const { getMessages, postMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// Get messages for a specific booking
router.get('/:bookingId', protect, getMessages);

// Post a new message
router.post('/', protect, postMessage);

module.exports = router;
