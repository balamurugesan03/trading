const Package = require('../models/Package');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const listPackages = catchAsync(async (req, res) => {
  const filter = req.user?.role === 'super_admin' ? {} : { active: true };
  const packages = await Package.find(filter).sort('minAmount');
  res.json({ success: true, packages });
});

const listPublicPackages = catchAsync(async (req, res) => {
  const packages = await Package.find({ active: true })
    .sort('minAmount')
    .select('name minAmount maxAmount description');
  res.json({ success: true, packages });
});

const createPackage = catchAsync(async (req, res) => {
  const { name, minAmount, maxAmount, description } = req.body;
  if (!name || minAmount === undefined || maxAmount === undefined) {
    throw new ApiError(400, 'Name, minAmount and maxAmount are required');
  }
  const pkg = await Package.create({ name, minAmount, maxAmount, description });
  res.status(201).json({ success: true, package: pkg });
});

const updatePackage = catchAsync(async (req, res) => {
  const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!pkg) throw new ApiError(404, 'Package not found');
  res.json({ success: true, package: pkg });
});

module.exports = { listPackages, listPublicPackages, createPackage, updatePackage };
