const mongoose = require('mongoose');
const { Schema } = mongoose;

// One rate document per calendar day, set/updated by admin.
const roiRateSchema = new Schema(
  {
    date: { type: String, required: true, unique: true }, // YYYY-MM-DD
    percentage: { type: Number, required: true },
    setBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Set the instant the daily ROI cron first uses this rate to credit a payout cycle (see
    // roiService.js). Once locked, settingController.setTodayRoiRate refuses further edits to
    // this date so every investment in the same cycle is credited at the same rate, even if
    // the admin changes "today's" rate mid-day - the new value only applies from the next cycle.
    locked: { type: Boolean, default: false },
    lockedAt: { type: Date, default: null },
    // True once this date's rate has been changed after its initial creation. Only one such
    // edit is allowed per date (see settingController.setTodayRoiRate) - a second edit attempt
    // is rejected and the value from the first edit stands for the rest of the day.
    edited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RoiRate', roiRateSchema);
