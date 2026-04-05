const express = require('express');
const { body, param, query } = require('express-validator');
const { recordController } = require('../controllers');
const { protect, isAnalyst, isAdmin, checkPermission, createLimiter } = require('../middlewares');
const validate = require('../middlewares/validate');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Valid categories
const validCategories = [
  'salary', 'investment', 'freelance', 'bonus', 'other_income',
  'food', 'transportation', 'utilities', 'entertainment', 'healthcare',
  'education', 'shopping', 'rent', 'insurance', 'other_expense'
];

// Validation rules
const recordIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid record ID')
];

const createRecordValidation = [
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['income', 'expense'])
    .withMessage('Type must be income or expense'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(validCategories)
    .withMessage('Invalid category'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date'),
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Note cannot exceed 500 characters')
];

const updateRecordValidation = [
  ...recordIdValidation,
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Type must be income or expense'),
  body('category')
    .optional()
    .isIn(validCategories)
    .withMessage('Invalid category'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date'),
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Note cannot exceed 500 characters')
];

const getRecordsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Type must be income or expense'),
  query('category')
    .optional()
    .isIn(validCategories)
    .withMessage('Invalid category'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  query('sortBy')
    .optional()
    .isIn(['date', 'amount', 'type', 'category', 'createdAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

/**
 * @swagger
 * /api/records:
 *   get:
 *     summary: Get all records
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         description: Filter by type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: List of records
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/', isAnalyst, getRecordsValidation, validate, recordController.getRecords);

/**
 * @swagger
 * /api/records/deleted:
 *   get:
 *     summary: Get soft-deleted records
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of deleted records
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/deleted', isAdmin, recordController.getDeletedRecords);

/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     summary: Get a record by ID
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Record ID
 *     responses:
 *       200:
 *         description: Record details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', isAnalyst, recordIdValidation, validate, recordController.getRecord);

/**
 * @swagger
 * /api/records:
 *   post:
 *     summary: Create a new record
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - type
 *               - category
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 1500.50
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Record created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/', isAdmin, createLimiter, createRecordValidation, validate, recordController.createRecord);

/**
 * @swagger
 * /api/records/{id}:
 *   put:
 *     summary: Update a record
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Record updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', isAdmin, createLimiter, updateRecordValidation, validate, recordController.updateRecord);

/**
 * @swagger
 * /api/records/{id}:
 *   delete:
 *     summary: Soft delete a record
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record soft deleted
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', isAdmin, recordIdValidation, validate, recordController.deleteRecord);

/**
 * @swagger
 * /api/records/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted record
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record restored successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:id/restore', isAdmin, recordIdValidation, validate, recordController.restoreRecord);

/**
 * @swagger
 * /api/records/{id}/permanent:
 *   delete:
 *     summary: Permanently delete a soft-deleted record
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record permanently deleted
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id/permanent', isAdmin, recordIdValidation, validate, recordController.permanentDeleteRecord);

module.exports = router;
