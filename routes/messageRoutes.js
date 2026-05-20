// routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const { getMessages, postMessage } = require('../controllers/messageController');
const auth = require('../middleware/auth');

// Get messages for a specific booking (query param ?bookingId=...)
router.get('/:bookingId', auth, getMessages);

// Post a new message
router.post('/', auth, postMessage);

module.exports = router;
