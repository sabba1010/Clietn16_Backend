const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Listing title is required'],
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  tagline: {
    type: String,
    trim: true
  },
  keywords: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['service', 'rental', 'event'],
    default: 'service'
  },
  package: {
    type: String,
    default: 'monthly'
  },
  // Location
  address: {
    type: String,
    trim: true
  },
  friendlyAddress: {
    type: String,
    trim: true
  },
  region: {
    type: String,
    trim: true
  },
  googlePlaceId: {
    type: String,
    trim: true
  },
  longitude: {
    type: Number
  },
  latitude: {
    type: Number
  },
  // Gallery
  images: [{
    type: String
  }],
  // Details
  description: {
    type: String,
    trim: true
  },
  videoSource: {
    type: String,
    enum: ['url', 'file'],
    default: 'url'
  },
  videoUrl: {
    type: String,
    trim: true
  },
  videoFile: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  enableContactWidget: {
    type: Boolean,
    default: false
  },
  socialLinks: {
    facebook: { type: String, trim: true },
    twitter: { type: String, trim: true },
    youtube: { type: String, trim: true },
    instagram: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
    tiktok: { type: String, trim: true }
  },
  minPrice: {
    type: Number
  },
  maxPrice: {
    type: Number
  },
  // Booking
  enableBooking: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Pending', 'Rejected', 'Active'],
    default: 'Pending'
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  // Services & pricing
  services: [{
    service: { type: String, required: true },
    price: { type: String, required: true },
    desc: { type: String }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Listing', listingSchema);
