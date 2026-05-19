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

const User = require('../models/User');
const Listing = require('../models/Listing');

// Public route to seed test listings
router.get('/seed', async (req, res) => {
  try {
    let user = await User.findOne();
    if (!user) {
      user = await User.create({
        username: 'testuser',
        email: 'testuser@oppashaven.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin'
      });
    }

    await Listing.deleteMany({
      title: { $in: [
        'Oppas Premium Dog Sitting & Care',
        'Friendly Pet Taxi & Boarding',
        'Inactive Grooming Service'
      ]}
    });

    const pendingListing = await Listing.create({
      user: user._id,
      title: 'Oppas Premium Dog Sitting & Care',
      tagline: 'Reliable overnight stay and care for your pets',
      category: 'house-sitting',
      address: 'Cape Town, South Africa',
      friendlyAddress: 'Cape Town, WC',
      region: 'California',
      latitude: -33.9249,
      longitude: 18.4241,
      minPrice: 25,
      maxPrice: 60,
      phone: '+27 82 123 4567',
      website: 'https://oppashaven.co.za',
      email: 'sitter@oppashaven.co.za',
      status: 'Pending',
      description: 'We offer professional pet sitting, house sitting, and dog boarding services in Cape Town. Experienced sitters with police clearance and first-aid certification.',
      enableContactWidget: true,
      socialLinks: {
        facebook: 'https://facebook.com/oppashaven',
        instagram: 'https://instagram.com/oppashaven'
      }
    });

    const activeListing = await Listing.create({
      user: user._id,
      title: 'Friendly Pet Taxi & Boarding',
      tagline: 'Safe pet transport and comfortable boarding services',
      category: 'boarding',
      address: 'Johannesburg, South Africa',
      friendlyAddress: 'Johannesburg, GP',
      region: 'Texas',
      latitude: -26.2041,
      longitude: 28.0473,
      minPrice: 30,
      maxPrice: 80,
      phone: '+27 83 987 6543',
      website: 'https://oppashaven.co.za',
      email: 'transport@oppashaven.co.za',
      status: 'Active',
      description: 'Reliable pet transportation services. We safely transport your pets to vets, groomers, or boarding facilities. Air-conditioned vehicles with custom crates.',
      enableContactWidget: true
    });

    const rejectedListing = await Listing.create({
      user: user._id,
      title: 'Inactive Grooming Service',
      tagline: 'Mobile pet grooming at your doorstep',
      category: 'dog-walking',
      address: 'Durban, South Africa',
      friendlyAddress: 'Durban, KZN',
      region: 'Florida',
      latitude: -29.8587,
      longitude: 31.0218,
      minPrice: 20,
      maxPrice: 50,
      status: 'Rejected',
      rejectionReason: 'Invalid contact details provided. Sitter phone number is unreachable.',
      description: 'Mobile dog wash and grooming. Premium shampoos, warm water wash, blow dry, nail clipping, and ear cleaning included.'
    });

    res.status(200).json({
      success: true,
      message: 'Database seeded successfully',
      data: [pendingListing, activeListing, rejectedListing]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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
