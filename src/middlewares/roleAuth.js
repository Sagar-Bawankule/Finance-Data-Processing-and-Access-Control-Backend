const { ROLES, hasPermission } = require('../../config/roles');

// Check if user has required role(s)
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`
      });
    }

    next();
  };
};

// Check if user has required permission
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        message: `You don't have permission to perform this action`
      });
    }

    next();
  };
};

// Middleware for specific roles
const isAdmin = authorize(ROLES.ADMIN);
const isAnalyst = authorize(ROLES.ANALYST, ROLES.ADMIN);
const isViewer = authorize(ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN);

module.exports = {
  authorize,
  checkPermission,
  isAdmin,
  isAnalyst,
  isViewer
};
