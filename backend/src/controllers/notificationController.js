const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const myNotifications = catchAsync(async (req, res) => {
  const filter = {
    active: true,
    $or: [{ user: req.user._id }, { user: null }],
  };
  if (req.query.category) filter.category = req.query.category;
  const notifications = await Notification.find(filter).sort('-createdAt');
  res.json({ success: true, notifications });
});

const myUnreadCount = catchAsync(async (req, res) => {
  const count = await Notification.countDocuments({
    active: true,
    read: false,
    category: 'transactional',
    user: req.user._id,
  });
  res.json({ success: true, count });
});

const markRead = catchAsync(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
  if (!notification) throw new ApiError(404, 'Notification not found');
  res.json({ success: true, notification });
});

const markAllRead = catchAsync(async (req, res) => {
  const filter = { user: req.user._id, read: false };
  if (req.query.category) filter.category = req.query.category;
  await Notification.updateMany(filter, { read: true });
  res.json({ success: true });
});

const createNotification = catchAsync(async (req, res) => {
  const { title, message, userId } = req.body;
  if (!title || !message) throw new ApiError(400, 'Title and message are required');
  const notification = await Notification.create({ title, message, user: userId || null });
  res.status(201).json({ success: true, notification });
});

const listNotifications = catchAsync(async (req, res) => {
  const notifications = await Notification.find().sort('-createdAt').limit(200);
  res.json({ success: true, notifications });
});

const toggleActive = catchAsync(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw new ApiError(404, 'Notification not found');
  notification.active = !notification.active;
  await notification.save();
  res.json({ success: true, notification });
});

module.exports = {
  myNotifications,
  myUnreadCount,
  markRead,
  markAllRead,
  createNotification,
  listNotifications,
  toggleActive,
};
