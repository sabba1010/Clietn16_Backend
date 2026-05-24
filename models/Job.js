const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    enum: [
      'Pet Sitting',
      'Dog Walking',
      'Pet Boarding',
      'Pet Day Care',
      'Holiday Home Sitting',
      'Security Checks',
      'Drop-In Visits',
      'Pet Taxi'
    ],
    required: true
  },
  petType: {
    type: String,
    default: 'Dog'
  },
  petImages: {
    type: [String],
    default: []
  },
  budget: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Active', 'Rejected'],
    default: 'Pending'
  },
  applicants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isFilled: {
    type: Boolean,
    default: false
  },
  acceptedSitter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);
