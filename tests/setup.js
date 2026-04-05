const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Set test environment variables
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.JWT_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';

let mongoServer;

// Connect to in-memory database before tests
const connect = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
};

// Clear all collections after each test
const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

// Disconnect and stop server after tests
const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

module.exports = {
  connect,
  clearDatabase,
  closeDatabase
};
