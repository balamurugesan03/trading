const MonthlyIncentive = require('../models/MonthlyIncentive');
const catchAsync = require('../utils/catchAsync');

const listIncentives = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.month) filter.month = req.query.month;
  const incentives = await MonthlyIncentive.find(filter).populate('user', 'name email').sort('-createdAt');
  res.json({ success: true, incentives });
});

module.exports = { listIncentives };
