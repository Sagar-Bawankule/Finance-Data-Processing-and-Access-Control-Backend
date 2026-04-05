const { dashboardService } = require('../services');

// @desc    Get dashboard summary
// @route   GET /api/dashboard/summary
// @access  Private/All authenticated users
const getDashboardSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getDashboardSummary(req.user.id);

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get total income
// @route   GET /api/dashboard/income
// @access  Private/All authenticated users
const getTotalIncome = async (req, res, next) => {
  try {
    const totalIncome = await dashboardService.getTotalIncome(req.user.id);

    res.status(200).json({
      success: true,
      data: { totalIncome }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get total expense
// @route   GET /api/dashboard/expense
// @access  Private/All authenticated users
const getTotalExpense = async (req, res, next) => {
  try {
    const totalExpense = await dashboardService.getTotalExpense(req.user.id);

    res.status(200).json({
      success: true,
      data: { totalExpense }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get net balance
// @route   GET /api/dashboard/balance
// @access  Private/All authenticated users
const getNetBalance = async (req, res, next) => {
  try {
    const netBalance = await dashboardService.getNetBalance(req.user.id);

    res.status(200).json({
      success: true,
      data: { netBalance }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category-wise totals
// @route   GET /api/dashboard/categories
// @access  Private/All authenticated users
const getCategoryTotals = async (req, res, next) => {
  try {
    const categoryTotals = await dashboardService.getCategoryTotals(req.user.id);

    res.status(200).json({
      success: true,
      data: { categoryTotals }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly trends
// @route   GET /api/dashboard/trends
// @access  Private/All authenticated users
const getMonthlyTrends = async (req, res, next) => {
  try {
    const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
    const monthlyTrends = await dashboardService.getMonthlyTrends(req.user.id, year);

    res.status(200).json({
      success: true,
      data: monthlyTrends
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent activity
// @route   GET /api/dashboard/recent
// @access  Private/All authenticated users
const getRecentActivity = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const recentActivity = await dashboardService.getRecentActivity(req.user.id, limit);

    res.status(200).json({
      success: true,
      data: { recentActivity }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getTotalIncome,
  getTotalExpense,
  getNetBalance,
  getCategoryTotals,
  getMonthlyTrends,
  getRecentActivity
};
