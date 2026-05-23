require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listing');
const uploadRoutes = require('./routes/upload');
const bookingRoutes = require('./routes/bookingRoutes');
const messageRoutes = require('./routes/messageRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const jobRoutes = require('./routes/jobRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Initialize express app
const app = express();
const server = http.createServer(app);

// ─── Socket.io Setup ───────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach io to app so controllers/routes can use it
app.set('io', io);

io.on('connection', (socket) => {
  // Join a booking room to receive real-time messages
  socket.on('join_booking', (bookingId) => {
    socket.join(`booking_${bookingId}`);
  });

  socket.on('leave_booking', (bookingId) => {
    socket.leave(`booking_${bookingId}`);
  });

  socket.on('disconnect', () => { });
});

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Legacy local uploads (dev only). New uploads use Cloudinary URLs.
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Base verification route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Home Paw Role-Based Authentication API Server',
    status: 'Running'
  });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminRoutes);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Requested API endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Define server port
const PORT = process.env.PORT || 5000;

// Start listening
server.listen(PORT, () => {
  console.log(`🔥 Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`🔌 Socket.io is active`);
});

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err, promise) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
