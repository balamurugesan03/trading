const mongoose = require('mongoose');
const { Schema } = mongoose;

const supportMessageSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['customer', 'admin'], required: true },
    message: { type: String, required: true, trim: true },
    readByAdmin: { type: Boolean, default: false },
    readByCustomer: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
