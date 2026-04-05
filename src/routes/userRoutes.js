const express = require('express');
const { body, param, query } = require('express-validator');
const { userController } = require('../controllers');
const { protect, isAdmin } = require('../middlewares');
const validate = require('../middlewares/validate');

const router = express.Router();

// All routes require admin access
router.use(protect, isAdmin);

// Validation rules
const userIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID')
];

const updateUserValidation = [
  ...userIdValidation,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['viewer', 'analyst', 'admin'])
    .withMessage('Role must be viewer, analyst, or admin'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status must be active, inactive, or suspended')
];

const updateStatusValidation = [
  ...userIdValidation,
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status must be active, inactive, or suspended')
];

const updateRoleValidation = [
  ...userIdValidation,
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['viewer', 'analyst', 'admin'])
    .withMessage('Role must be viewer, analyst, or admin')
];

const getUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('role')
    .optional()
    .isIn(['viewer', 'analyst', 'admin'])
    .withMessage('Role must be viewer, analyst, or admin'),
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status must be active, inactive, or suspended')
];

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
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
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [viewer, analyst, admin]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/', getUsersValidation, validate, userController.getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Users]
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
 *         description: User details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', userIdValidation, validate, userController.getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user (Admin only)
 *     tags: [Users]
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
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [viewer, analyst, admin]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', updateUserValidation, validate, userController.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Users]
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
 *         description: User deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', userIdValidation, validate, userController.deleteUser);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: Update user status (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch('/:id/status', updateStatusValidation, validate, userController.updateUserStatus);

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Update user role (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [viewer, analyst, admin]
 *     responses:
 *       200:
 *         description: Role updated successfully
 */
router.patch('/:id/role', updateRoleValidation, validate, userController.updateUserRole);

module.exports = router;
