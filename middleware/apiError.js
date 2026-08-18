const { friendlyError } = require('../utils/friendlyError');

module.exports.apiErrorHandler = function apiErrorHandler(err, req, res, next) {
  if (!req.path.startsWith('/api')) {
    return next(err);
  }

  const { statusCode, message } = friendlyError(err);

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({ error: message });
};

module.exports.apiNotFound = function apiNotFound(req, res) {
  res.status(404).json({ error: "That API route doesn’t exist." });
};
