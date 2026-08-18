const mongoose = require('mongoose');
const ExpressError = require('../utils/expressError');

function isValidId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function requireValidId(param, label) {
  return (req, res, next) => {
    const value = req.params[param];
    if (value && !isValidId(value)) {
      return next(new ExpressError(`We couldn't find that ${label}.`, 404));
    }
    next();
  };
}

module.exports = { isValidId, requireValidId };
