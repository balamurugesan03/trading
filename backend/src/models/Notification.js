const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // null = broadcast to all
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    // Controls whether this notification is currently shown on the customer dashboard ticker.
    // Admin can "stop" a notification without deleting its history.
    active: { type: Boolean, default: true },
    // 'broadcast' = admin-authored announcements (the dashboard ticker).
    // 'transactional' = system-generated per-user alerts (withdrawal status changes, etc.),
    // shown in the customer's notification bell instead of the ticker.
    category: { type: String, enum: ['broadcast', 'transactional'], default: 'broadcast' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
