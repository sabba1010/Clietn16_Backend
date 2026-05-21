const Listing = require('../models/Listing');
const Review = require('../models/Review');
const Job = require('../models/Job');
const Booking = require('../models/Booking');
const User = require('../models/User');

const formatTimeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      activeListings,
      pendingListings,
      totalListings,
      totalReviews,
      totalJobs,
      pendingJobs,
      activeJobs,
      filledJobs,
      totalBookings,
      pendingBookings,
      approvedBookings,
      totalUsers,
      recentListings,
      recentBookings,
      recentJobs,
      allBookings,
    ] = await Promise.all([
      Listing.countDocuments({ status: 'Active' }),
      Listing.countDocuments({ status: 'Pending' }),
      Listing.countDocuments(),
      Review.countDocuments(),
      Job.countDocuments(),
      Job.countDocuments({ status: 'Pending' }),
      Job.countDocuments({ status: 'Active', isFilled: false }),
      Job.countDocuments({ isFilled: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'Pending' }),
      Booking.countDocuments({ status: 'Approved' }),
      User.countDocuments(),
      Listing.find().sort({ updatedAt: -1 }).limit(5).select('title status updatedAt'),
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('client', 'firstName lastName username')
        .populate('listing', 'title')
        .select('customerName status createdAt listing'),
      Job.find().sort({ createdAt: -1 }).limit(5).select('title status createdAt petType'),
      Booking.find({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
        .select('createdAt')
        .lean(),
    ]);

    const activityItems = [];

    recentListings.forEach((l) => {
      activityItems.push({
        id: `listing-${l._id}`,
        title: l.title,
        action:
          l.status === 'Pending'
            ? 'submitted for review'
            : l.status === 'Active'
              ? 'was approved'
              : 'was updated',
        time: formatTimeAgo(l.updatedAt),
        createdAt: l.updatedAt,
      });
    });

    recentBookings.forEach((b) => {
      const clientName = b.client
        ? `${b.client.firstName || ''} ${b.client.lastName || ''}`.trim() || b.client.username
        : b.customerName;
      activityItems.push({
        id: `booking-${b._id}`,
        title: b.listing?.title || 'Booking',
        action: `— new booking by ${clientName} (${b.status})`,
        time: formatTimeAgo(b.createdAt),
        createdAt: b.createdAt,
      });
    });

    recentJobs.forEach((j) => {
      activityItems.push({
        id: `job-${j._id}`,
        title: j.title,
        action: `— job posted (${j.status}, ${j.petType || 'Pet'})`,
        time: formatTimeAgo(j.createdAt),
        createdAt: j.createdAt,
      });
    });

    activityItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const bookingsByDay = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      bookingsByDay[key] = 0;
    }
    allBookings.forEach((b) => {
      const key = new Date(b.createdAt).toISOString().slice(0, 10);
      if (bookingsByDay[key] !== undefined) bookingsByDay[key]++;
    });
    const bookingsChart = Object.entries(bookingsByDay).map(([date, count]) => ({
      date,
      label: date.slice(5),
      count,
    }));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          activeListings,
          pendingListings,
          totalListings,
          totalReviews,
          totalJobs,
          pendingJobs,
          activeJobs,
          filledJobs,
          totalBookings,
          pendingBookings,
          approvedBookings,
          totalUsers,
        },
        recentActivities: activityItems.slice(0, 10),
        bookingsChart,
      },
    });
  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching dashboard stats' });
  }
};
