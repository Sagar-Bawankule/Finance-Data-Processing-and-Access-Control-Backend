const request = require('supertest');
const express = require('express');
const { connect, clearDatabase, closeDatabase } = require('./setup');
const User = require('../src/models/User');
const Record = require('../src/models/Record');
const { generateToken } = require('../src/middlewares/auth');

// Create test app without rate limiting
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Create custom routes without rate limiting for tests
  const dashboardRouter = require('express').Router();
  const { query } = require('express-validator');
  const { dashboardController } = require('../src/controllers');
  const { protect, isViewer } = require('../src/middlewares');
  const validate = require('../src/middlewares/validate');

  const yearValidation = [
    query('year').optional().isInt({ min: 2000, max: 2100 })
  ];
  const recentValidation = [
    query('limit').optional().isInt({ min: 1, max: 50 })
  ];

  dashboardRouter.use(protect, isViewer);
  dashboardRouter.get('/summary', dashboardController.getDashboardSummary);
  dashboardRouter.get('/income', dashboardController.getTotalIncome);
  dashboardRouter.get('/expense', dashboardController.getTotalExpense);
  dashboardRouter.get('/balance', dashboardController.getNetBalance);
  dashboardRouter.get('/categories', dashboardController.getCategoryTotals);
  dashboardRouter.get('/trends', yearValidation, validate, dashboardController.getMonthlyTrends);
  dashboardRouter.get('/recent', recentValidation, validate, dashboardController.getRecentActivity);

  app.use('/api/dashboard', dashboardRouter);
  
  const { errorHandler, notFound } = require('../src/middlewares');
  app.use(notFound);
  app.use(errorHandler);
  
  return app;
};

describe('Dashboard API', () => {
  let app;
  let userToken;
  let testUser;

  beforeAll(async () => {
    await connect();
    app = createTestApp();
  });

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'viewer'
    });
    userToken = generateToken(testUser._id);

    // Create test records
    await Record.create([
      { userId: testUser._id, amount: 5000, type: 'income', category: 'salary', date: new Date('2024-01-15') },
      { userId: testUser._id, amount: 2000, type: 'income', category: 'freelance', date: new Date('2024-01-20') },
      { userId: testUser._id, amount: 500, type: 'expense', category: 'food', date: new Date('2024-01-10') },
      { userId: testUser._id, amount: 1000, type: 'expense', category: 'transportation', date: new Date('2024-01-12') },
      { userId: testUser._id, amount: 300, type: 'expense', category: 'entertainment', date: new Date('2024-01-18') }
    ]);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('GET /api/dashboard/summary', () => {
    it('should get complete dashboard summary', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalIncome).toBe(7000);
      expect(res.body.data.totalExpense).toBe(1800);
      expect(res.body.data.netBalance).toBe(5200);
      expect(res.body.data.categoryTotals).toBeDefined();
      expect(res.body.data.recentActivity).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/dashboard/income', () => {
    it('should get total income', async () => {
      const res = await request(app)
        .get('/api/dashboard/income')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalIncome).toBe(7000);
    });
  });

  describe('GET /api/dashboard/expense', () => {
    it('should get total expense', async () => {
      const res = await request(app)
        .get('/api/dashboard/expense')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalExpense).toBe(1800);
    });
  });

  describe('GET /api/dashboard/balance', () => {
    it('should get net balance', async () => {
      const res = await request(app)
        .get('/api/dashboard/balance')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.netBalance).toBe(5200);
    });
  });

  describe('GET /api/dashboard/categories', () => {
    it('should get category-wise totals', async () => {
      const res = await request(app)
        .get('/api/dashboard/categories')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.categoryTotals).toBeDefined();
      expect(Array.isArray(res.body.data.categoryTotals)).toBe(true);
    });
  });

  describe('GET /api/dashboard/trends', () => {
    it('should get monthly trends for current year', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.year).toBeDefined();
      expect(res.body.data.data.length).toBe(12); // 12 months
    });

    it('should get monthly trends for specified year', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends?year=2024')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.year).toBe(2024);
    });

    it('should fail with invalid year', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends?year=1999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/dashboard/recent', () => {
    it('should get recent activity with default limit', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recentActivity).toBeDefined();
      expect(res.body.data.recentActivity.length).toBeLessThanOrEqual(10);
    });

    it('should get recent activity with custom limit', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent?limit=3')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.recentActivity.length).toBe(3);
    });

    it('should fail with invalid limit', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent?limit=100')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
