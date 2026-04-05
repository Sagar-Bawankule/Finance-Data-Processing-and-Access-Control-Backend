const mongoose = require('mongoose');
const Record = require('../models/Record');

class RecordService {
  buildReadScope(user) {
    if (!user) {
      return {};
    }

    if (user.role === 'admin' || user.role === 'analyst') {
      return {};
    }

    const userId = user._id || user.id || user;
    return { userId: new mongoose.Types.ObjectId(userId) };
  }

  buildQuery(user, filters) {
    const query = this.buildReadScope(user);

    if (filters.type && ['income', 'expense'].includes(filters.type)) {
      query.type = filters.type;
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.date.$lte = new Date(filters.endDate);
      }
    }

    if (filters.search) {
      query.note = { $regex: filters.search, $options: 'i' };
    }

    if (filters.includeDeleted) {
      query.isDeleted = { $in: [true, false] };
    }

    return query;
  }

  async getRecords(user, filters = {}, options = {}) {
    const query = this.buildQuery(user, filters);
    
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

  async createRecord(userId, recordData) {
    const record = new Record({
      ...recordData,
      userId
    });
    return await record.save();
  }

  async getRecordById(recordId, user) {
    const query = {
      _id: recordId,
      ...this.buildReadScope(user)
    };
    return await Record.findOne(query);
  }

  async updateRecord(recordId, userId, updateData) {
    const record = await Record.findOneAndUpdate(
      { _id: recordId, userId },
      updateData,
      { new: true, runValidators: true }
    );
    return record;
  }

  async deleteRecord(recordId, userId) {
    const record = await Record.findOneAndUpdate(
      { _id: recordId, userId },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    return record;
  }

  async hardDeleteRecord(recordId, userId) {
    const record = await Record.findOneAndDelete({ _id: recordId, userId, isDeleted: true });
    return record;
  }

  async restoreRecord(recordId, userId) {
    const record = await Record.findOneAndUpdate(
      { _id: recordId, userId, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      { new: true }
    );
    return record;
  }

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
