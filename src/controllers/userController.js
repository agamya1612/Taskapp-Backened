
const User = require('../models/User');

exports.me = async (req, res) => {
  const user = await User.findById(req.user._id).select('-passwordHash');
  res.json(user);
};

exports.updateMe = async (req, res) => {
  const payload = {};
  if (req.body.name) payload.name = req.body.name;
  if (req.body.avatarUrl) payload.avatarUrl = req.body.avatarUrl;

  const updated = await User.findByIdAndUpdate(req.user._id, payload, { new: true }).select('-passwordHash');
  res.json(updated);
};
