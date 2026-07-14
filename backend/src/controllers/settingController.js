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

  // Once the cron has already used this date's rate to credit a payout cycle (see
  // roiService.runDailyRoi), it's locked - editing it here would split one cycle across two
  // percentages. The new value must go to the next, not-yet-started cycle instead.
  const existing = await RoiRate.findOne({ date: key });
  if (existing && existing.locked) {
    throw new ApiError(
      400,
      `The ${key} payout cycle already ran at ${existing.percentage}% and is locked. ` +
        'Set a rate for the next cycle\'s date instead - it cannot be changed retroactively.'
    );
  }

  // Only one edit is allowed per date after its initial creation - the first "Set Rate" call
  // isn't an edit, but changing it again the same day is, and a second change attempt is
  // rejected so the rate from that one edit stands for the rest of the day.
  if (existing && existing.edited) {
    throw new ApiError(
      400,
      `The rate for ${key} has already been edited once today and is locked at ` +
        `${existing.percentage}%. It can only be changed again from tomorrow.`
    );
  }

  const update = existing
    ? { percentage, setBy: req.user._id, edited: true }
    : { date: key, percentage, setBy: req.user._id };

  const rate = await RoiRate.findOneAndUpdate({ date: key }, update, { upsert: true, new: true });

  res.json({ success: true, rate });
});

const listRoiRates = catchAsync(async (req, res) => {
  const rates = await RoiRate.find().sort('-date').limit(90);
  res.json({ success: true, rates });
});

module.exports = { getGlobalSettings, updateGlobalSettings, setTodayRoiRate, listRoiRates };
