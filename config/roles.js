// Role definitions and permissions
const ROLES = {
  VIEWER: 'viewer',
  ANALYST: 'analyst',
  ADMIN: 'admin'
};

// Permission mappings for each role
const PERMISSIONS = {
  [ROLES.VIEWER]: ['dashboard:read'],
  [ROLES.ANALYST]: ['dashboard:read', 'records:read'],
  [ROLES.ADMIN]: [
    'dashboard:read',
    'records:read',
    'records:create',
    'records:update',
    'records:delete',
    'users:read',
    'users:create',
    'users:update',
    'users:delete'
  ]
};

// Check if a role has a specific permission
const hasPermission = (role, permission) => {
  const rolePermissions = PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
};

// Get all permissions for a role
const getPermissions = (role) => {
  return PERMISSIONS[role] || [];
};

module.exports = {
  ROLES,
  PERMISSIONS,
  hasPermission,
  getPermissions
};
