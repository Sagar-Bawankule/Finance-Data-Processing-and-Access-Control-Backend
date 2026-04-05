const express = require('express');
const { query } = require('express-validator');
const { dashboardController } = require('../controllers');
const { protect, isViewer } = require('../middlewares');
const validate = require('../middlewares/validate');

const router = express.Router();

// All routes require authentication and at least viewer role
router.use(protect, isViewer);

// Validation rules
const yearValidation = [
  query('year')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be a valid year between 2000 and 2100')
];
const recentValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get complete dashboard summary
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DashboardSummary'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/summary', dashboardController.getDashboardSummary);

/**
 * @swagger
 * /api/dashboard/income:
 *   get:
 *     summary: Get total income
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total income amount
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalIncome:
 *                       type: number
 */
router.get('/income', dashboardController.getTotalIncome);

/**
 * @swagger
 * /api/dashboard/expense:
 *   get:
 *     summary: Get total expense
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total expense amount
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalExpense:
 *                       type: number
 */
router.get('/expense', dashboardController.getTotalExpense);

/**
 * @swagger
 * /api/dashboard/balance:
 *   get:
 *     summary: Get net balance
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Net balance (income - expense)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     netBalance:
 *                       type: number
 */
router.get('/balance', dashboardController.getNetBalance);

/**
 * @swagger
 * /api/dashboard/categories:
 *   get:
 *     summary: Get category-wise totals
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Totals grouped by category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     categoryTotals:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                           type:
 *                             type: string
 *                           total:
 *                             type: number
 *                           count:
 *                             type: integer
 */
router.get('/categories', dashboardController.getCategoryTotals);

/**
 * @swagger
 * /api/dashboard/trends:
 *   get:
 *     summary: Get monthly trends
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           minimum: 2000
 *           maximum: 2100
 *         description: Year for trends (defaults to current year)
 *     responses:
 *       200:
 *         description: Monthly income/expense trends
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     year:
 *                       type: integer
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: integer
 *                           monthName:
 *                             type: string
 *                           income:
 *                             type: number
 *                           expense:
 *                             type: number
 *                           net:
 *                             type: number
 */
router.get('/trends', yearValidation, validate, dashboardController.getMonthlyTrends);

/**
 * @swagger
 * /api/dashboard/recent:
 *   get:
 *     summary: Get recent activity
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of recent records to return
 *     responses:
 *       200:
 *         description: Recent financial records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Record'
 */
router.get('/recent', recentValidation, validate, dashboardController.getRecentActivity);

module.exports = router;
