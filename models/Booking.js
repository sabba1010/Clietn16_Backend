const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sitter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: false
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: false
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  petCount: {
    type: Number,
    required: true
  },
  requirements: {
    type: String
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  serviceType: {
    type: String,
    default: 'General Pet Boarding'
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Cancelled'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Unpaid'],
    default: 'Paid' // assuming paid during checkout
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
