// Import required modules
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Global connection variable for reuse across function invocations
let isConnected = false;

// Optimized MongoDB connection for serverless
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    if (process.env.MONGO_URI) {
      // Set mongoose options for serverless
      mongoose.set('bufferCommands', false);
      mongoose.set('bufferMaxEntries', 0);
      
      // Connect with optimized settings for serverless
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        socketTimeoutMS: 45000,
        maxPoolSize: 1, // Maintain up to 1 socket connections
        minPoolSize: 0, // Maintain up to 0 socket connections  
        maxIdleTimeMS: 30000,
      });
      
      isConnected = true;
      console.log('MongoDB connected successfully');
    } else {
      console.warn('MONGO_URI not provided - running without database');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    isConnected = false;
  }
};

// Middleware to ensure DB connection on each request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection middleware error:', error);
    next(); // Continue even if DB connection fails
  }
});

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend is running',
    status: 'success',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check route  
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Example API route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API endpoint working',
    data: {
      users: ['user1', 'user2'],
      timestamp: new Date().toISOString()
    },
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Export the Express app (No app.listen for serverless)
module.exports = app;
