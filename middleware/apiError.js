const ExpressError = require('../utils/expressError');

module.exports.apiErrorHandler = function apiErrorHandler(err, req, res, next) {
  if (!req.path.startsWith('/api')) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({ error: message });
};

module.exports.apiNotFound = function apiNotFound(req, res) {
  res.status(404).json({ error: 'API route not found' });
};
