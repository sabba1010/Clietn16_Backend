const express = require('express');
const router = express.Router();
const {
  createListing,
  getListings,
  getMyListings,
  getListingById,
  updateListing,
  deleteListing
} = require('../controllers/listingController');
const { protect } = require('../middleware/auth');

// Public route to fetch all listings
router.get('/', getListings);

// Public route to fetch single listing by ID
router.get('/id/:id', getListingById);

// Protected route to get logged-in user's listings
router.get('/my-listings', protect, getMyListings);

// Protected route to create a listing
router.post('/', protect, createListing);

// Protected routes to update and delete a listing
router.put('/:id', protect, updateListing);
router.delete('/:id', protect, deleteListing);

module.exports = router;
