const express = require('express');
const router = express.Router();
const { 
  createBooking, 
  getMyBookings, 
  getSitterBookings, 
  getSitterAvailability,
  updateBookingStatus 
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.route('/')
  .post(protect, createBooking);

router.get('/availability', getSitterAvailability);

router.route('/my-bookings')
  .get(protect, getMyBookings);

router.route('/sitter-bookings')
  .get(protect, getSitterBookings);

router.route('/:id/status')
  .put(protect, updateBookingStatus);

module.exports = router;
