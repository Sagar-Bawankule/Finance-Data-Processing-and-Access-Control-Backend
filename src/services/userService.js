const User = require('../models/User');

class UserService {
  // Get paginated users with filters
  async getUsers(filters = {}, options = {}) {
    const query = {};

    // Filter by role
    if (filters.role) {
      query.role = filters.role;
    }

    // Filter by status
    if (filters.status) {
      query.status = filters.status;
    }

    // Search by name or email
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
  }

  // Get user by ID
  async getUserById(userId) {
    return await User.findById(userId).select('-password');
  }

  // Update user
  async updateUser(userId, updateData) {
    // Prevent password update through this method
    delete updateData.password;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    return user;
  }

  // Delete user
  async deleteUser(userId) {
    return await User.findByIdAndDelete(userId);
  }

  // Update user status
  async updateUserStatus(userId, status) {
    return await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true, runValidators: true }
    ).select('-password');
  }

  // Update user role
  async updateUserRole(userId, role) {
    return await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');
  }
}

module.exports = new UserService();
