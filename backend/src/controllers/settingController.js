const RoiRate = require('../models/RoiRate');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { getSettings } = require('../services/incomeService');
const { todayKey } = require('../services/roiService');
const Setting = require('../models/Setting');

const getGlobalSettings = catchAsync(async (req, res) => {
  const settings = await getSettings();
  res.json({ success: true, settings });
});

const updateGlobalSettings = catchAsync(async (req, res) => {
  const settings = await Setting.findOneAndUpdate({ key: 'global' }, req.body, {
    new: true,
    upsert: true,
  });
  res.json({ success: true, settings });
});

const setTodayRoiRate = catchAsync(async (req, res) => {
  const { percentage, date } = req.body;
  if (percentage === undefined) throw new ApiError(400, 'Percentage is required');

  const key = date || todayKey(new Date());
  const rate = await RoiRate.findOneAndUpdate(
    { date: key },
    { date: key, percentage, setBy: req.user._id },
    { upsert: true, new: true }
  );

  res.json({ success: true, rate });
});

const listRoiRates = catchAsync(async (req, res) => {
  const rates = await RoiRate.find().sort('-date').limit(90);
  res.json({ success: true, rates });
});

module.exports = { getGlobalSettings, updateGlobalSettings, setTodayRoiRate, listRoiRates };
