const Booking = require('../models/Booking');
const Listing = require('../models/Listing');

// Create new booking
exports.createBooking = async (req, res) => {
  try {
    const {
      listingId,
      sitterId,
      date,
      time,
      petCount,
      requirements,
      customerName,
      customerEmail,
      totalAmount,
      serviceType
    } = req.body;

    if (!listingId) {
      return res.status(400).json({ success: false, message: 'Listing is required' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Always assign the listing owner as the sitter so bookings reach their dashboard
    const resolvedSitterId = listing.user?.toString() || sitterId;
    if (!resolvedSitterId) {
      return res.status(400).json({ success: false, message: 'Sitter not found for this listing' });
    }

    const booking = new Booking({
      client: req.user.id,
      listing: listingId,
      sitter: resolvedSitterId,
      date,
      time: time || 'Not specified',
      petCount,
      requirements,
      customerName,
      customerEmail,
      totalAmount: totalAmount ?? listing.minPrice ?? 0,
      serviceType: serviceType || listing.title || listing.category || 'Pet Care',
      status: 'Pending'
    });

    const savedBooking = await booking.save();

    res.status(201).json({
      success: true,
      data: savedBooking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: 'Server error creating booking' });
  }
};

// Get bookings for logged in user (Client)
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ client: req.user.id })
      .populate('listing', 'title logo category address')
      .populate('sitter', 'firstName lastName username avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching client bookings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get bookings for logged in sitter (Seller)
exports.getSitterBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ sitter: req.user.id })
      .populate('listing', 'title logo category address')
      .populate('client', 'firstName lastName username avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching sitter bookings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify ownership (only sitter can approve/cancel, or client can cancel)
    if (booking.sitter.toString() !== req.user.id && booking.client.toString() !== req.user.id) {
       return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
