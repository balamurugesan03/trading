const mongoose = require('mongoose');
const { Schema } = mongoose;

// One rate document per calendar day, set/updated by admin.
const roiRateSchema = new Schema(
  {
    date: { type: String, required: true, unique: true }, // YYYY-MM-DD
    percentage: { type: Number, required: true },
    setBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RoiRate', roiRateSchema);
