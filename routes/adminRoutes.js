const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard-stats', protect, authorize('admin', 'superuser'), getDashboardStats);

module.exports = router;
