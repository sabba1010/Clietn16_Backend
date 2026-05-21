const Message = require('../models/Message');
const Booking = require('../models/Booking');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// Helper function to extract user ID string whether populated or not
const getUserId = (user) => {
  if (!user) return null;
  if (user._id) return user._id.toString();
  return user.toString();
};

// @desc    Get messages for a booking
// @route   GET /api/messages/:bookingId
// @access  Private
exports.getMessages = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId).populate('client sitter');
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }
  const requesterId = req.user.id;
  const clientId = getUserId(booking.client);
  const sitterId = getUserId(booking.sitter);
  if (clientId !== requesterId && sitterId !== requesterId) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  const messages = await Message.find({ booking: bookingId })
    .populate('sender', 'firstName lastName avatar')
    .sort({ createdAt: 1 });
  res.json({ success: true, data: messages });
});

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
exports.postMessage = asyncHandler(async (req, res) => {
  const { bookingId, content } = req.body;
  if (!bookingId || !content) {
    return res.status(400).json({ success: false, message: 'bookingId and content are required' });
  }
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }
  const senderId = req.user.id;
  const clientId = getUserId(booking.client);
  const sitterId = getUserId(booking.sitter);
  if (clientId !== senderId && sitterId !== senderId) {
    return res.status(403).json({ success: false, message: 'Not authorized to send message' });
  }

  const message = await Message.create({ booking: bookingId, sender: senderId, content });
  const populated = await message.populate('sender', 'firstName lastName avatar');

  // ─── Real-time: emit to the booking room ───────────────
  const io = req.app.get('io');
  if (io) {
    io.to(`booking_${bookingId}`).emit('new_message', populated);
  }

  res.status(201).json({ success: true, data: populated });
});
