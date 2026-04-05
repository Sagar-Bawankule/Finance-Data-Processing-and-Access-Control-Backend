const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('./setup');
const User = require('../src/models/User');
const { generateToken } = require('../src/middlewares/auth');

// Create test app without rate limiting
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Import routes but skip rate limiting for tests
  const router = require('express').Router();
  const { body } = require('express-validator');
  const { authController } = require('../src/controllers');
  const { protect } = require('../src/middlewares');
  const validate = require('../src/middlewares/validate');

  // Validation rules
  const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }),
    body('email').trim().notEmpty().isEmail().normalizeEmail(),
    body('password').notEmpty().isLength({ min: 6 }),
    body('role').optional().isIn(['viewer', 'analyst', 'admin'])
  ];

  const loginValidation = [
    body('email').trim().notEmpty().isEmail(),
    body('password').notEmpty()
  ];

  const passwordValidation = [
    body('currentPassword').notEmpty(),
    body('newPassword').notEmpty().isLength({ min: 6 })
  ];

  router.post('/register', registerValidation, validate, authController.register);
  router.post('/login', loginValidation, validate, authController.login);
  router.get('/me', protect, authController.getMe);
  router.put('/password', protect, passwordValidation, validate, authController.updatePassword);

  app.use('/api/auth', router);
  
  const { errorHandler, notFound } = require('../src/middlewares');
  app.use(notFound);
  app.use(errorHandler);
  
  return app;
};

describe('Auth API', () => {
  let app;

  beforeAll(async () => {
    await connect();
    app = createTestApp();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.user.role).toBe('viewer');
      expect(res.body.data.token).toBeDefined();
    });

    it('should fail with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with missing name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with duplicate email', async () => {
      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User 1',
          email: 'test@example.com',
          password: 'password123'
        });

      // Try to create second user with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User 2',
          email: 'test@example.com',
          password: 'password456'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.token).toBeDefined();
    });

    it('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let token;
    let userId;

    beforeEach(async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
      
      token = registerRes.body.data.token;
      userId = registerRes.body.data.user.id;
    });

    it('should get current user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
    });

    it('should fail without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/password', () => {
    let token;

    beforeEach(async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
      
      token = registerRes.body.data.token;
    });

    it('should update password successfully', async () => {
      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify can login with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'newpassword123'
        });

      expect(loginRes.statusCode).toBe(200);
    });

    it('should fail with wrong current password', async () => {
      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
