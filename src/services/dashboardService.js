const Record = require('../models/Record');
const mongoose = require('mongoose');

class DashboardService {
  buildDashboardMatch(user) {
    if (!user) {
      return {};
    }

    if (user.role === 'admin' || user.role === 'analyst' || user.role === 'viewer') {
      return {};
    }

    const userId = user._id || user.id || user;
    return { userId: new mongoose.Types.ObjectId(userId) };
  }

  async getTotalIncome(user) {
    const matchScope = this.buildDashboardMatch(user);
    const result = await Record.aggregate([
      {
        $match: {
          ...matchScope,
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

  async getTotalExpense(user) {
    const matchScope = this.buildDashboardMatch(user);
    const result = await Record.aggregate([
      {
        $match: {
          ...matchScope,
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

  async getNetBalance(user) {
    const income = await this.getTotalIncome(user);
    const expense = await this.getTotalExpense(user);
    return income - expense;
  }

  async getCategoryTotals(user) {
    const matchScope = this.buildDashboardMatch(user);
    const result = await Record.aggregate([
      {
        $match: {
          ...matchScope
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

  async getMonthlyTrends(user, year) {
    const targetYear = year || new Date().getFullYear();
    const matchScope = this.buildDashboardMatch(user);

    const result = await Record.aggregate([
      {
        $match: {
          ...matchScope,
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

  async getRecentActivity(user, limit = 10) {
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(50, limit)) : 10;
    const query = this.buildDashboardMatch(user);
    const records = await Record.find(query)
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

  async getDashboardSummary(user) {
    const [totalIncome, totalExpense, categoryTotals, monthlyTrends, recentActivity] = await Promise.all([
      this.getTotalIncome(user),
      this.getTotalExpense(user),
      this.getCategoryTotals(user),
      this.getMonthlyTrends(user),
      this.getRecentActivity(user, 5)
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
