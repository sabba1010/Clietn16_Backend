require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listing');

// Initialize express app
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for local development, adjust for production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base verification route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Oppas Haven Role-Based Authentication API Server',
    status: 'Running'
  });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);

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
const server = app.listen(PORT, () => {
  console.log(`🔥 Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err, promise) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
