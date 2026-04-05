const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Dashboard API',
      version: '1.0.0',
      description: 'A complete Finance Dashboard backend API with role-based access control',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role: { type: 'string', enum: ['viewer', 'analyst', 'admin'], example: 'viewer' },
            status: { type: 'string', enum: ['active', 'inactive', 'suspended'], example: 'active' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Record: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            amount: { type: 'number', example: 1500.50 },
            type: { type: 'string', enum: ['income', 'expense'], example: 'income' },
            category: { 
              type: 'string', 
              enum: ['salary', 'investment', 'freelance', 'bonus', 'other_income', 'food', 'transportation', 'utilities', 'entertainment', 'healthcare', 'education', 'shopping', 'rent', 'insurance', 'other_expense'],
              example: 'salary' 
            },
            date: { type: 'string', format: 'date', example: '2024-01-15' },
            note: { type: 'string', example: 'Monthly salary payment' },
            isDeleted: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        DashboardSummary: {
          type: 'object',
          properties: {
            totalIncome: { type: 'number', example: 50000 },
            totalExpense: { type: 'number', example: 30000 },
            netBalance: { type: 'number', example: 20000 },
            categoryTotals: { type: 'array', items: { type: 'object' } },
            monthlyTrends: { type: 'object' },
            recentActivity: { type: 'array', items: { $ref: '#/components/schemas/Record' } }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 100 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            totalPages: { type: 'integer', example: 10 },
            hasNextPage: { type: 'boolean', example: true },
            hasPrevPage: { type: 'boolean', example: false }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        ForbiddenError: {
          description: 'Not authorized to access this resource',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' }
            }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management (Admin only)' },
      { name: 'Records', description: 'Financial records management' },
      { name: 'Dashboard', description: 'Dashboard summary and analytics' }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
