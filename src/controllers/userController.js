const { userService } = require('../services');
const Record = require('../models/Record');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const filters = {
      role: req.query.role,
      status: req.query.status,
      search: req.query.search
    };

    const options = {
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await userService.getUsers(filters, options);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, status } = req.body;

    const user = await userService.updateUser(req.params.id, {
      name,
      email,
      role,
      status
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await userService.deleteUser(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Optionally delete all records associated with this user
    await Record.deleteMany({ userId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'User and associated records deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const user = await userService.updateUserStatus(req.params.id, status);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User status updated to '${status}'`,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PATCH /api/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    const user = await userService.updateUserRole(req.params.id, role);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User role updated to '${role}'`,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
  updateUserRole
};
