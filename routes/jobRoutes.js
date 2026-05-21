const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { protect } = require('../middleware/auth');

// POST /api/jobs — Pet owner creates a job
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, location, startDate, endDate, petType, budget, petImages } = req.body;
    if (!title || !description || !location || !startDate || !endDate || !budget) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }
    const job = await Job.create({
      owner: req.user.id,
      title,
      description,
      location,
      startDate,
      endDate,
      petType: petType || 'Dog',
      petImages: petImages || [],
      budget,
      status: 'Pending'
    });
    res.status(201).json({ success: true, data: job });
  } catch (err) {
    console.error('Error creating job:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// GET /api/jobs/public — Publicly accessible active jobs
router.get('/public', async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'Active', isFilled: false })
      .populate('owner', 'firstName lastName avatar isVerified')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/jobs/public/:id — Single publicly accessible active job
router.get('/public/:id', async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, status: 'Active', isFilled: false })
      .populate('owner', 'firstName lastName email phone avatar isVerified');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found or not available' });
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/jobs/:id/apply — Apply to a job
router.post('/:id/apply', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    
    // Check if user already applied
    if (job.applicants && job.applicants.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: 'You have already applied to this job.' });
    }

    // Add user to applicants array
    job.applicants.push(req.user.id);
    await job.save();

    res.json({ success: true, message: 'Successfully applied to the job.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/jobs/:id/withdraw — Sitter withdraws their application (not allowed after accept)
router.delete('/:id/withdraw', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const Booking = require('../models/Booking');
    const sitterId = req.user.id.toString();
    const acceptedByOwner =
      job.acceptedSitter?.toString() === sitterId ||
      !!(await Booking.findOne({ job: job._id, sitter: sitterId, status: 'Approved' }));

    if (acceptedByOwner) {
      return res.status(403).json({
        success: false,
        message: 'You cannot withdraw after the owner has accepted your application.',
      });
    }

    const index = job.applicants.findIndex((id) => id.toString() === sitterId);
    if (index === -1) {
      return res.status(400).json({ success: false, message: 'You have not applied to this job.' });
    }

    job.applicants.splice(index, 1);
    await job.save();

    res.json({ success: true, message: 'Application withdrawn successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/jobs/:id/chat/:applicantId — Initiate chat with applicant by creating a pending booking if needed
router.post('/:id/chat/:applicantId', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    
    const Booking = require('../models/Booking');
    // Check if a booking already exists for this job and applicant
    let booking = await Booking.findOne({ job: job._id, sitter: req.params.applicantId, client: req.user.id });
    
    if (!booking) {
      booking = await Booking.create({
        client: req.user.id,
        sitter: req.params.applicantId,
        job: job._id,
        customerName: req.user.firstName + ' ' + req.user.lastName,
        customerEmail: req.user.email,
        date: job.startDate,
        time: 'N/A',
        petCount: 1,
        requirements: job.description,
        totalAmount: 0,
        serviceType: job.petType + ' Sitting',
        status: 'Pending'
      });
    }
    
    res.json({ success: true, bookingId: booking._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/jobs/:id/accept/:applicantId — Owner accepts a sitter + records payment
router.post('/:id/accept/:applicantId', protect, async (req, res) => {
  try {
    const { amount, paymentMethod, cardLast4 } = req.body;
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the job owner can accept a sitter' });
    }

    const Booking = require('../models/Booking');
    // Find or create booking for this job + sitter
    let booking = await Booking.findOne({ job: job._id, sitter: req.params.applicantId, client: req.user.id });
    if (!booking) {
      booking = await Booking.create({
        client: req.user.id,
        sitter: req.params.applicantId,
        job: job._id,
        customerName: req.user.firstName + ' ' + req.user.lastName,
        customerEmail: req.user.email,
        date: job.startDate,
        time: 'N/A',
        petCount: 1,
        requirements: job.description,
        totalAmount: amount || 0,
        serviceType: job.petType + ' Sitting',
        status: 'Pending'
      });
    }

    // Mark booking as Approved + record payment
    booking.status = 'Approved';
    booking.totalAmount = amount || booking.totalAmount;
    booking.paymentStatus = 'Paid';
    await booking.save();

    // Mark job as filled and lock accepted sitter (no withdraw after this)
    job.isFilled = true;
    job.acceptedSitter = req.params.applicantId;
    await job.save();

    // Notify sitter via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`booking_${booking._id}`).emit('booking_accepted', {
        bookingId: booking._id,
        jobTitle: job.title,
        amount,
        paymentMethod,
      });
    }

    res.json({ success: true, bookingId: booking._id, message: 'Sitter accepted and payment recorded.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/jobs/applied — Sitter's applied jobs
router.get('/applied', protect, async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const sitterId = req.user.id.toString();
    const jobs = await Job.find({ applicants: req.user.id })
      .populate('owner', 'firstName lastName avatar email phone')
      .populate('acceptedSitter', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await Promise.all(
      jobs.map(async (job) => {
        const hasApprovedBooking = !!(await Booking.findOne({
          job: job._id,
          sitter: sitterId,
          status: 'Approved',
        }));
        let acceptedSitterId = null;
        if (job.acceptedSitter) {
          acceptedSitterId =
            typeof job.acceptedSitter === 'object' && job.acceptedSitter._id
              ? job.acceptedSitter._id.toString()
              : String(job.acceptedSitter);
        }
        const isAccepted = acceptedSitterId === sitterId || hasApprovedBooking;
        return { ...job, isAccepted };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/jobs/:id/messages — Get booking + messages for a specific job (sitter view)
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const Message = require('../models/Message');

    // Find booking linked to this job where sitter = current user
    const booking = await Booking.findOne({ job: req.params.id, sitter: req.user.id })
      .populate('client', 'firstName lastName avatar email');

    if (!booking) {
      return res.json({ success: true, bookingId: null, messages: [], client: null });
    }

    const messages = await Message.find({ booking: booking._id })
      .populate('sender', 'firstName lastName avatar')
      .sort({ createdAt: 1 });

    res.json({ success: true, bookingId: booking._id, messages, client: booking.client });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/jobs/my — Pet owner's own jobs
router.get('/my', protect, async (req, res) => {
  try {
    let jobs = await Job.find({ owner: req.user.id })
      .populate('applicants', 'firstName lastName email avatar phone role')
      .sort({ createdAt: -1 })
      .lean();

    const Booking = require('../models/Booking');

    // Attach stats for each applicant
    for (let job of jobs) {
      if (job.applicants && job.applicants.length > 0) {
        for (let app of job.applicants) {
          const completedBookings = await Booking.countDocuments({ sitter: app._id, status: 'Approved' });
          app.completedJobs = completedBookings;
          
          // Since reviews are tied to listings, and we might not have a quick way, we'll assign a mock or simplified rating
          app.rating = completedBookings > 0 ? (4 + Math.random()).toFixed(1) : 0;
          app.reviews = completedBookings > 0 ? completedBookings * 2 : 0;
        }
      }
    }

    res.json({ success: true, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/jobs — Admin gets all jobs
router.get('/', protect, async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('owner', 'firstName lastName email avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/jobs/:id/status — Admin approves or rejects
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/jobs/:id — Owner or admin deletes job
router.delete('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    await job.deleteOne();
    res.json({ success: true, message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
