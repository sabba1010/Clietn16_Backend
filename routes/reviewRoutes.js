const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Review = require('../models/Review');
const Booking = require('../models/Booking');

// Post a review (Only if has booking)
router.post('/', protect, async (req, res) => {
  try {
    const { listingId, rating, comment, name, email } = req.body;
    if (!listingId || !rating || !comment || !name || !email) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if user has a booking for this listing
    const booking = await Booking.findOne({
      client: req.user.id,
      listing: listingId
    });

    if (!booking) {
      return res.status(403).json({ success: false, message: 'You must book this listing first before reviewing it' });
    }

    const review = await Review.create({
      listing: listingId,
      user: req.user.id,
      name,
      email,
      rating: Number(rating),
      comment
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    console.error('Error posting review:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error posting review' });
  }
});

// Get reviews for a listing
router.get('/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params;
    const reviews = await Review.find({ listing: listingId }).sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error getting reviews' });
  }
});

// Get all reviews on sitter's own listings
router.get('/sitter/my-reviews', protect, async (req, res) => {
  try {
    const Listing = require('../models/Listing');
    // Find all listings owned by this sitter
    const listings = await Listing.find({ owner: req.user.id }).select('_id title');
    const listingIds = listings.map(l => l._id);

    const reviews = await Review.find({ listing: { $in: listingIds } })
      .populate('listing', 'title')
      .populate('user', 'firstName lastName avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error('Error fetching sitter reviews:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

module.exports = router;
