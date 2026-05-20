const User = require('../models/User');

exports.list = async (_req, res, next) => {
  try {
    const users = await User.find().select('name email role createdAt').sort('name');
    res.json(users);
  } catch (e) { next(e); }
};

exports.updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id, { role }, { new: true }
    ).select('name email role');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (e) { next(e); }
};
