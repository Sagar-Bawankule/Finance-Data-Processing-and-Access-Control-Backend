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
  const recordRouter = require('express').Router();
  const { body, param, query } = require('express-validator');
  const { recordController } = require('../src/controllers');
  const { protect, isAnalyst, isAdmin } = require('../src/middlewares');
  const validate = require('../src/middlewares/validate');

  const validCategories = [
    'salary', 'investment', 'freelance', 'bonus', 'other_income',
    'food', 'transportation', 'utilities', 'entertainment', 'healthcare',
    'education', 'shopping', 'rent', 'insurance', 'other_expense'
  ];

  const recordIdValidation = [param('id').isMongoId()];
  
  const createRecordValidation = [
    body('amount').notEmpty().isFloat({ min: 0.01 }),
    body('type').notEmpty().isIn(['income', 'expense']),
    body('category').notEmpty().isIn(validCategories),
    body('date').optional().isISO8601(),
    body('note').optional().trim().isLength({ max: 500 })
  ];

  const getRecordsValidation = [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isIn(['income', 'expense']),
    query('category').optional().isIn(validCategories)
  ];

  recordRouter.use(protect);
  recordRouter.get('/', isAnalyst, getRecordsValidation, validate, recordController.getRecords);
  recordRouter.get('/deleted', isAdmin, recordController.getDeletedRecords);
  recordRouter.get('/:id', isAnalyst, recordIdValidation, validate, recordController.getRecord);
  recordRouter.post('/', isAdmin, createRecordValidation, validate, recordController.createRecord);
  recordRouter.put('/:id', isAdmin, recordIdValidation, validate, recordController.updateRecord);
  recordRouter.delete('/:id', isAdmin, recordIdValidation, validate, recordController.deleteRecord);
  recordRouter.patch('/:id/restore', isAdmin, recordIdValidation, validate, recordController.restoreRecord);

  // Auth routes for test user creation
  const authRouter = require('express').Router();
  const { authController } = require('../src/controllers');
  const registerValidation = [
    body('name').trim().notEmpty(),
    body('email').trim().notEmpty().isEmail().normalizeEmail(),
    body('password').notEmpty().isLength({ min: 6 }),
    body('role').optional().isIn(['viewer', 'analyst', 'admin'])
  ];
  authRouter.post('/register', registerValidation, validate, authController.register);

  app.use('/api/auth', authRouter);
  app.use('/api/records', recordRouter);
  
  const { errorHandler, notFound } = require('../src/middlewares');
  app.use(notFound);
  app.use(errorHandler);
  
  return app;
};

describe('Records API', () => {
  let app;
  let adminToken;
  let analystToken;
  let viewerToken;
  let adminUser;
  let analystUser;
  let viewerUser;

  beforeAll(async () => {
    await connect();
    app = createTestApp();
  });

  beforeEach(async () => {
    // Create test users
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    });
    adminToken = generateToken(adminUser._id);

    analystUser = await User.create({
      name: 'Analyst User',
      email: 'analyst@example.com',
      password: 'password123',
      role: 'analyst'
    });
    analystToken = generateToken(analystUser._id);

    viewerUser = await User.create({
      name: 'Viewer User',
      email: 'viewer@example.com',
      password: 'password123',
      role: 'viewer'
    });
    viewerToken = generateToken(viewerUser._id);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /api/records', () => {
    const validRecord = {
      amount: 1500,
      type: 'income',
      category: 'salary',
      date: '2024-01-15',
      note: 'Monthly salary'
    };

    it('should create a record as admin', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validRecord);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.record.amount).toBe(1500);
      expect(res.body.data.record.type).toBe('income');
    });

    it('should fail to create record as analyst', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .send(validRecord);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should fail to create record as viewer', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(validRecord);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid amount', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validRecord, amount: -100 });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid type', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validRecord, type: 'invalid' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid category', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validRecord, category: 'invalid_category' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/records', () => {
    beforeEach(async () => {
      // Create some test records
      await Record.create([
        { userId: adminUser._id, amount: 1000, type: 'income', category: 'salary', date: new Date() },
        { userId: adminUser._id, amount: 500, type: 'expense', category: 'food', date: new Date() },
        { userId: adminUser._id, amount: 2000, type: 'income', category: 'freelance', date: new Date() }
      ]);
    });

    it('should get records as admin', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.records.length).toBe(3);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should allow analyst to view records created by other users', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.records.length).toBe(3);
    });

    it('should fail to get records as viewer', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should filter records by type', async () => {
      const res = await request(app)
        .get('/api/records?type=income')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.records.length).toBe(2);
      expect(res.body.data.records.every(r => r.type === 'income')).toBe(true);
    });

    it('should filter records by category', async () => {
      const res = await request(app)
        .get('/api/records?category=salary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.records.length).toBe(1);
    });

    it('should paginate records', async () => {
      const res = await request(app)
        .get('/api/records?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.records.length).toBe(2);
      expect(res.body.data.pagination.totalPages).toBe(2);
      expect(res.body.data.pagination.hasNextPage).toBe(true);
    });
  });

  describe('DELETE /api/records/:id (Soft Delete)', () => {
    let recordId;

    beforeEach(async () => {
      const record = await Record.create({
        userId: adminUser._id,
        amount: 1000,
        type: 'income',
        category: 'salary',
        date: new Date()
      });
      recordId = record._id;
    });

    it('should soft delete a record as admin', async () => {
      const res = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Record should still exist in database but marked as deleted
      const deletedRecord = await Record.findOne({ _id: recordId, isDeleted: true });
      expect(deletedRecord).toBeDefined();
      expect(deletedRecord.isDeleted).toBe(true);
    });

    it('should not show soft-deleted records in normal list', async () => {
      // Soft delete the record
      await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Get records - should be empty
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.records.length).toBe(0);
    });
  });

  describe('PATCH /api/records/:id/restore', () => {
    let recordId;

    beforeEach(async () => {
      const record = await Record.create({
        userId: adminUser._id,
        amount: 1000,
        type: 'income',
        category: 'salary',
        date: new Date(),
        isDeleted: true,
        deletedAt: new Date()
      });
      recordId = record._id;
    });

    it('should restore a soft-deleted record', async () => {
      const res = await request(app)
        .patch(`/api/records/${recordId}/restore`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.record.isDeleted).toBe(false);
    });
  });
});
