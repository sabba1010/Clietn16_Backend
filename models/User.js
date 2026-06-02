const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please fill a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['owner', 'sitter', 'admin', 'superuser'],
    default: 'owner'
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  avatar: { type: String, default: '' },
  verificationReport: { type: String, default: '' },
  policeVerification: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  displayName: { type: String, default: '' },
  location: { type: String, default: '' },
  phone: { type: String, default: '' },
  profession: { type: String, default: '' },
  aboutUs: { type: String, default: '' },
  homeFeatures: {
    nonSmoking: { type: Boolean, default: false },
    spaciousBackyard: { type: Boolean, default: false },
    securityAlarm: { type: Boolean, default: false },
    homeChecks: { type: Boolean, default: false }
  },
  pets: [{
    name: String,
    type: { type: String },
    age: String,
    image: String,
    rating: { type: Number, default: 5.0 }
  }]
}, {
  timestamps: true
});

// Pre-save middleware to hash passwords
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
