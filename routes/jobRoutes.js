const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { protect } = require('../middleware/auth');

// POST /api/jobs — Pet owner creates a job
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, location, startDate, endDate, petType, budget } = req.body;
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
      budget: budget || '',
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
    const jobs = await Job.find({ status: 'Active' })
      .populate('owner', 'firstName lastName avatar isVerified')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/jobs/my — Pet owner's own jobs
router.get('/my', protect, async (req, res) => {
  try {
    const jobs = await Job.find({ owner: req.user.id }).sort({ createdAt: -1 });
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
