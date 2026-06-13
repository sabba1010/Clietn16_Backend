const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, updateProfile, getUserProfileById, purchasePackage } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile/:id', getUserProfileById);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/purchase-package', protect, purchasePackage);

module.exports = router;
