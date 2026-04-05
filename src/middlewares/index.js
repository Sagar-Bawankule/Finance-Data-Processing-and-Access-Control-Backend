const { protect, generateToken } = require('./auth');
const { authorize, checkPermission, isAdmin, isAnalyst, isViewer } = require('./roleAuth');
const { errorHandler, notFound } = require('./errorHandler');
const validate = require('./validate');
const { apiLimiter, authLimiter, createLimiter } = require('./rateLimiter');

module.exports = {
  protect,
  generateToken,
  authorize,
  checkPermission,
  isAdmin,
  isAnalyst,
  isViewer,
  errorHandler,
  notFound,
  validate,
  apiLimiter,
  authLimiter,
  createLimiter
};
