const jwt = require('jsonwebtoken');
const User = require('../models/User');

const sign = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sanitize = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    // first user becomes admin
    const count = await User.countDocuments();
    const role = count === 0 ? 'admin' : 'member';

    const user = await User.create({ name, email, password, role });
    res.status(201).json({ token: sign(user), user: sanitize(user) });
  } catch (e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ token: sign(user), user: sanitize(user) });
  } catch (e) { next(e); }
};

exports.me = async (req, res) => res.json({ user: sanitize(req.user) });
