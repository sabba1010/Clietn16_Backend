const Booking = require('../models/Booking');
const Listing = require('../models/Listing');

const ACTIVE_STATUSES = ['Pending', 'Approved'];

const normalizeTime = (time) => {
  const raw = String(time || '').trim();
  if (!raw || ['N/A', 'undefined', 'null', 'Not specified'].includes(raw)) {
    return '00:00';
  }
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
  return raw;
};

const isSlotTaken = async (sitterId, date, time) => {
  const normalizedTime = normalizeTime(time);
  const existing = await Booking.find({
    sitter: sitterId,
    date,
    status: { $in: ACTIVE_STATUSES },
  }).select('time');

  return existing.some((b) => normalizeTime(b.time) === normalizedTime);
};

// Public: booked slots for a sitter (via listingId or sitterId)
exports.getSitterAvailability = async (req, res) => {
  try {
    const { listingId, sitterId } = req.query;
    let resolvedSitterId = sitterId;

    if (listingId) {
      const listing = await Listing.findById(listingId);
      if (!listing) {
        return res.status(404).json({ success: false, message: 'Listing not found' });
      }
      resolvedSitterId = listing.user?.toString();
    }

    if (!resolvedSitterId) {
      return res.status(400).json({ success: false, message: 'listingId or sitterId is required' });
    }

    const bookings = await Booking.find({
      sitter: resolvedSitterId,
      status: { $in: ACTIVE_STATUSES },
    }).select('date time');

    const slots = bookings.map((b) => ({
      date: b.date,
      time: normalizeTime(b.time),
    }));

    res.status(200).json({ success: true, data: slots });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

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

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    const normalizedTime = normalizeTime(time);

    if (await isSlotTaken(resolvedSitterId, date, normalizedTime)) {
      return res.status(409).json({
        success: false,
        message: 'This date and time is already booked. Please choose another slot.',
      });
    }

    const booking = new Booking({
      client: req.user.id,
      listing: listingId,
      sitter: resolvedSitterId,
      date,
      time: normalizedTime,
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

    // When approving, ensure no other active booking holds this slot
    if (status === 'Approved') {
      const conflict = await Booking.findOne({
        _id: { $ne: booking._id },
        sitter: booking.sitter,
        date: booking.date,
        status: { $in: ACTIVE_STATUSES },
      });

      if (conflict && normalizeTime(conflict.time) === normalizeTime(booking.time)) {
        return res.status(409).json({
          success: false,
          message: 'Another booking already exists for this date and time.',
        });
      }
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
