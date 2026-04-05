const Record = require('../models/Record');
const mongoose = require('mongoose');

class DashboardService {
  // Get total income for a user
  async getTotalIncome(userId) {
    const result = await Record.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: 'income'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  // Get total expense for a user
  async getTotalExpense(userId) {
    const result = await Record.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: 'expense'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  // Get net balance (income - expense)
  async getNetBalance(userId) {
    const income = await this.getTotalIncome(userId);
    const expense = await this.getTotalExpense(userId);
    return income - expense;
  }

  // Get category-wise totals
  async getCategoryTotals(userId) {
    const result = await Record.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: {
            category: '$category',
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id.category',
          type: '$_id.type',
          total: 1,
          count: 1
        }
      },
      {
        $sort: { type: 1, total: -1 }
      }
    ]);

    return result;
  }

  // Get monthly trends
  async getMonthlyTrends(userId, year) {
    const targetYear = year || new Date().getFullYear();

    const result = await Record.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: {
            $gte: new Date(`${targetYear}-01-01`),
            $lt: new Date(`${targetYear + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          type: '$_id.type',
          total: 1,
          count: 1
        }
      },
      {
        $sort: { month: 1 }
      }
    ]);

    // Format result to have all 12 months
    const monthlyData = [];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    for (let i = 1; i <= 12; i++) {
      const incomeData = result.find(r => r.month === i && r.type === 'income');
      const expenseData = result.find(r => r.month === i && r.type === 'expense');

      monthlyData.push({
        month: i,
        monthName: monthNames[i - 1],
        income: incomeData ? incomeData.total : 0,
        expense: expenseData ? expenseData.total : 0,
        incomeCount: incomeData ? incomeData.count : 0,
        expenseCount: expenseData ? expenseData.count : 0,
        net: (incomeData ? incomeData.total : 0) - (expenseData ? expenseData.total : 0)
      });
    }

    return {
      year: targetYear,
      data: monthlyData
    };
  }

  // Get recent activity
  async getRecentActivity(userId, limit = 10) {
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(50, limit)) : 10;
    const records = await Record.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(safeLimit)
      .lean();

    return records.map((record) => ({
      id: record._id,
      amount: record.amount,
      type: record.type,
      category: record.category,
      date: record.date,
      note: record.note || ''
    }));
  }

  // Get complete dashboard summary
  async getDashboardSummary(userId) {
    const [totalIncome, totalExpense, categoryTotals, monthlyTrends, recentActivity] = await Promise.all([
      this.getTotalIncome(userId),
      this.getTotalExpense(userId),
      this.getCategoryTotals(userId),
      this.getMonthlyTrends(userId),
      this.getRecentActivity(userId, 5)
    ]);

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      categoryTotals,
      monthlyTrends,
      recentActivity
    };
  }
}

module.exports = new DashboardService();
