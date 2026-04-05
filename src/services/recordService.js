const Record = require('../models/Record');

class RecordService {
  // Build query for filtering records
  buildQuery(userId, filters) {
    const query = { userId };

    // Filter by type
    if (filters.type && ['income', 'expense'].includes(filters.type)) {
      query.type = filters.type;
    }

    // Filter by category
    if (filters.category) {
      query.category = filters.category;
    }

    // Filter by date range
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.date.$lte = new Date(filters.endDate);
      }
    }

    // Search in notes
    if (filters.search) {
      query.note = { $regex: filters.search, $options: 'i' };
    }

    // Include deleted records if specified
    if (filters.includeDeleted) {
      query.isDeleted = { $in: [true, false] };
    }

    return query;
  }

  // Get paginated records with filters
  async getRecords(userId, filters = {}, options = {}) {
    const query = this.buildQuery(userId, filters);
    
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const sortField = options.sortBy || 'date';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

    const [records, total] = await Promise.all([
      Record.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Record.countDocuments(query)
    ]);

    return {
      records,
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

  // Create a new record
  async createRecord(userId, recordData) {
    const record = new Record({
      ...recordData,
      userId
    });
    return await record.save();
  }

  // Get a single record
  async getRecordById(recordId, userId) {
    return await Record.findOne({ _id: recordId, userId });
  }

  // Update a record
  async updateRecord(recordId, userId, updateData) {
    const record = await Record.findOneAndUpdate(
      { _id: recordId, userId },
      updateData,
      { new: true, runValidators: true }
    );
    return record;
  }

  // Soft delete a record
  async deleteRecord(recordId, userId) {
    const record = await Record.findOneAndUpdate(
      { _id: recordId, userId },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    return record;
  }

  // Permanently delete a record (hard delete)
  async hardDeleteRecord(recordId, userId) {
    const record = await Record.findOneAndDelete({ _id: recordId, userId, isDeleted: true });
    return record;
  }

  // Restore a soft-deleted record
  async restoreRecord(recordId, userId) {
    const record = await Record.findOneAndUpdate(
      { _id: recordId, userId, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      { new: true }
    );
    return record;
  }

  // Get deleted records
  async getDeletedRecords(userId, options = {}) {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { userId, isDeleted: true };

    const [records, total] = await Promise.all([
      Record.find(query)
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Record.countDocuments(query)
    ]);

    return {
      records,
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
}

module.exports = new RecordService();
