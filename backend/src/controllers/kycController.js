const Kyc = require('../models/Kyc');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const submitKyc = catchAsync(async (req, res) => {
  const { aadhaarNumber, panNumber } = req.body;
  const files = req.files || {};
  if (!files.aadhaar || !files.pan) {
    throw new ApiError(400, 'Aadhaar and PAN documents are required');
  }

  const update = {
    user: req.user._id,
    aadhaarNumber,
    panNumber,
    aadhaarUrl: `/uploads/${files.aadhaar[0].filename}`,
    panUrl: `/uploads/${files.pan[0].filename}`,
    status: 'pending',
    remarks: '',
    reviewedBy: null,
    reviewedAt: null,
  };

  const kyc = await Kyc.findOneAndUpdate({ user: req.user._id }, update, {
    upsert: true,
    new: true,
  });

  req.user.kycStatus = 'pending';
  await req.user.save();

  res.status(201).json({ success: true, kyc });
});

const myKyc = catchAsync(async (req, res) => {
  const kyc = await Kyc.findOne({ user: req.user._id });
  res.json({ success: true, kyc });
});

const listKyc = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const kycs = await Kyc.find(filter).populate('user', 'name email mobile').sort('-createdAt');
  res.json({ success: true, kycs });
});

const reviewKyc = catchAsync(async (req, res) => {
  const { status, remarks } = req.body;
  if (!['approved', 'rejected'].includes(status)) throw new ApiError(400, 'Invalid status');

  const kyc = await Kyc.findById(req.params.id);
  if (!kyc) throw new ApiError(404, 'KYC record not found');

  kyc.status = status;
  kyc.remarks = remarks || '';
  kyc.reviewedBy = req.user._id;
  kyc.reviewedAt = new Date();
  await kyc.save();

  await User.findByIdAndUpdate(kyc.user, { kycStatus: status });

  res.json({ success: true, kyc });
});

module.exports = { submitKyc, myKyc, listKyc, reviewKyc };
