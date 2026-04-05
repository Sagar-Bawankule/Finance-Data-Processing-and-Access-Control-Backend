const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0']
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: {
        values: ['income', 'expense'],
        message: 'Type must be income or expense'
      }
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: {
        values: [
          'salary',
          'investment',
          'freelance',
          'bonus',
          'other_income',
          'food',
          'transportation',
          'utilities',
          'entertainment',
          'healthcare',
          'education',
          'shopping',
          'rent',
          'insurance',
          'other_expense'
        ],
        message: 'Invalid category'
      }
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters']
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient querying
recordSchema.index({ userId: 1, date: -1 });
recordSchema.index({ userId: 1, type: 1 });
recordSchema.index({ userId: 1, category: 1 });
recordSchema.index({ userId: 1, isDeleted: 1 });

// Pre-find middleware to exclude soft deleted records by default
recordSchema.pre(/^find/, function() {
  if (this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
});

// Pre-aggregate middleware to exclude soft deleted records
recordSchema.pre('aggregate', function() {
  const pipeline = this.pipeline();
  const firstStage = pipeline[0];
  if (!firstStage || !firstStage.$match || firstStage.$match.isDeleted === undefined) {
    pipeline.unshift({ $match: { isDeleted: { $ne: true } } });
  }
});

// Pre-countDocuments middleware
recordSchema.pre('countDocuments', function() {
  if (this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
});

const Record = mongoose.model('Record', recordSchema);

module.exports = Record;
