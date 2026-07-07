const SupportMessage = require('../models/SupportMessage');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

// ----- Customer side -----

const myMessages = catchAsync(async (req, res) => {
  const messages = await SupportMessage.find({ customer: req.user._id }).sort('createdAt');
  res.json({ success: true, messages });
});

const sendMyMessage = catchAsync(async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) throw new ApiError(400, 'Message is required');
  const doc = await SupportMessage.create({
    customer: req.user._id,
    sender: req.user._id,
    senderRole: 'customer',
    message: message.trim(),
    readByCustomer: true,
  });
  res.status(201).json({ success: true, message: doc });
});

const markMyRead = catchAsync(async (req, res) => {
  await SupportMessage.updateMany(
    { customer: req.user._id, senderRole: 'admin', readByCustomer: false },
    { readByCustomer: true }
  );
  res.json({ success: true });
});

const myUnreadCount = catchAsync(async (req, res) => {
  const count = await SupportMessage.countDocuments({
    customer: req.user._id,
    senderRole: 'admin',
    readByCustomer: false,
  });
  res.json({ success: true, count });
});

// ----- Admin side -----

const listConversations = catchAsync(async (req, res) => {
  const conversations = await SupportMessage.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$customer',
        lastMessage: { $first: '$message' },
        lastMessageAt: { $first: '$createdAt' },
        lastSenderRole: { $first: '$senderRole' },
        unreadCount: {
          $sum: {
            $cond: [{ $and: [{ $eq: ['$senderRole', 'customer'] }, { $eq: ['$readByAdmin', false] }] }, 1, 0],
          },
        },
      },
    },
    { $sort: { lastMessageAt: -1 } },
  ]);

  const customerIds = conversations.map((c) => c._id);
  const users = await User.find({ _id: { $in: customerIds } }).select('name email status');
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const result = conversations
    .map((c) => ({
      customer: userMap.get(String(c._id)) || null,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      lastSenderRole: c.lastSenderRole,
      unreadCount: c.unreadCount,
    }))
    .filter((c) => c.customer);

  res.json({ success: true, conversations: result });
});

const unreadCount = catchAsync(async (req, res) => {
  const count = await SupportMessage.countDocuments({ senderRole: 'customer', readByAdmin: false });
  res.json({ success: true, count });
});

const getConversation = catchAsync(async (req, res) => {
  const customer = await User.findById(req.params.customerId).select('name email status');
  if (!customer) throw new ApiError(404, 'Customer not found');
  const messages = await SupportMessage.find({ customer: req.params.customerId }).sort('createdAt');
  res.json({ success: true, customer, messages });
});

const sendAdminMessage = catchAsync(async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) throw new ApiError(400, 'Message is required');
  const customer = await User.findById(req.params.customerId);
  if (!customer) throw new ApiError(404, 'Customer not found');
  const doc = await SupportMessage.create({
    customer: customer._id,
    sender: req.user._id,
    senderRole: 'admin',
    message: message.trim(),
    readByAdmin: true,
  });
  res.status(201).json({ success: true, message: doc });
});

const markConversationRead = catchAsync(async (req, res) => {
  await SupportMessage.updateMany(
    { customer: req.params.customerId, senderRole: 'customer', readByAdmin: false },
    { readByAdmin: true }
  );
  res.json({ success: true });
});

module.exports = {
  myMessages,
  sendMyMessage,
  markMyRead,
  myUnreadCount,
  listConversations,
  unreadCount,
  getConversation,
  sendAdminMessage,
  markConversationRead,
};
