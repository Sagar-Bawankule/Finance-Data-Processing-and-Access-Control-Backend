// Simple test script to verify the serverless setup
const app = require('./api/index.js');

const PORT = process.env.PORT || 3000;

// For local testing only - this simulates Vercel's serverless environment
const server = app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test API: http://localhost:${PORT}/api/test`);
  console.log(`\n✅ Ready for Vercel deployment!`);
});

module.exports = server;