const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  getUserBookings,
  toggleBlockUser,
  deleteUser,
  approveUser,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const adminOnly = [protect, authorize('admin', 'superuser')];

router.get('/dashboard-stats', ...adminOnly, getDashboardStats);
router.get('/users', ...adminOnly, getAllUsers);
router.get('/users/:id/bookings', ...adminOnly, getUserBookings);
router.put('/users/:id/block', ...adminOnly, toggleBlockUser);
router.put('/users/:id/approve', ...adminOnly, approveUser);
router.delete('/users/:id', ...adminOnly, deleteUser);

module.exports = router;
