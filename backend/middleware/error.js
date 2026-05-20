const { validationResult } = require('express-validator');

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

exports.notFound = (req, res) => res.status(404).json({ message: 'Route not found' });

exports.errorHandler = (err, _req, res, _next) => {
  console.error(err);
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate entry' });
  }
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
};
