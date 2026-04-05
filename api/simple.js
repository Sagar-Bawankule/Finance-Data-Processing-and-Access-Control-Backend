// Simple serverless function without MongoDB for testing
const express = require('express');
const cors = require('cors');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend is running',
    status: 'success',
    timestamp: new Date().toISOString(),
    database: 'not connected (test mode)',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check route  
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
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
    }
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