const { recordService } = require('../services');

// @desc    Create new record
// @route   POST /api/records
// @access  Private/Admin
const createRecord = async (req, res, next) => {
  try {
    const { amount, type, category, date, note } = req.body;

    const record = await recordService.createRecord(req.user.id, {
      amount,
      type,
      category,
      date,
      note
    });

    res.status(201).json({
      success: true,
      message: 'Record created successfully',
      data: { record }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all records
// @route   GET /api/records
// @access  Private/Analyst, Admin
const getRecords = async (req, res, next) => {
  try {
    const filters = {
      type: req.query.type,
      category: req.query.category,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search
    };

    const options = {
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };

    const result = await recordService.getRecords(req.user, filters, options);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single record
// @route   GET /api/records/:id
// @access  Private/Analyst, Admin
const getRecord = async (req, res, next) => {
  try {
    const record = await recordService.getRecordById(req.params.id, req.user);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { record }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update record
// @route   PUT /api/records/:id
// @access  Private/Admin
const updateRecord = async (req, res, next) => {
  try {
    const { amount, type, category, date, note } = req.body;

    const record = await recordService.updateRecord(req.params.id, req.user.id, {
      amount,
      type,
      category,
      date,
      note
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Record updated successfully',
      data: { record }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete record
// @route   DELETE /api/records/:id
// @access  Private/Admin
const deleteRecord = async (req, res, next) => {
  try {
    const record = await recordService.deleteRecord(req.params.id, req.user.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Record deleted successfully (soft delete)'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get deleted records
// @route   GET /api/records/deleted
// @access  Private/Admin
const getDeletedRecords = async (req, res, next) => {
  try {
    const options = {
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await recordService.getDeletedRecords(req.user.id, options);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore soft-deleted record
// @route   PATCH /api/records/:id/restore
// @access  Private/Admin
const restoreRecord = async (req, res, next) => {
  try {
    const record = await recordService.restoreRecord(req.params.id, req.user.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Deleted record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Record restored successfully',
      data: { record }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete record
// @route   DELETE /api/records/:id/permanent
// @access  Private/Admin
const permanentDeleteRecord = async (req, res, next) => {
  try {
    const record = await recordService.hardDeleteRecord(req.params.id, req.user.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Deleted record not found. Only soft-deleted records can be permanently deleted.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Record permanently deleted'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRecord,
  getRecords,
  getRecord,
  updateRecord,
  deleteRecord,
  getDeletedRecords,
  restoreRecord,
  permanentDeleteRecord
};
