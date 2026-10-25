const mongoose = require('mongoose');
const ExpressError = require('./expressError');

// Counters live in Mongo because serverless instances don't share memory.
const hitSchema = new mongoose.Schema(
  { _id: String, count: Number, expiresAt: Date },
  { versionKey: false }
);
hitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const RateLimitHit = mongoose.model('RateLimitHit', hitSchema);

const MESSAGE = 'Too many attempts. Please wait a few minutes and try again.';

// ponytail: fixed window, so a burst straddling a window edge can reach 2x max; move to a sliding window if that matters.
function rateLimit({ name, windowMs, max, key }) {
  return async (req, res, next) => {
    const id = key(req);
    if (!id) return next();

    const bucket = Math.floor(Date.now() / windowMs);
    const resetAt = (bucket + 1) * windowMs;
    try {
      const hit = await RateLimitHit.findOneAndUpdate(
        { _id: `${name}:${id}:${bucket}` },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(resetAt) } },
        { upsert: true, new: true }
      );
      if (hit.count > max) {
        res.set('Retry-After', String(Math.ceil((resetAt - Date.now()) / 1000)));
        return next(new ExpressError(MESSAGE, 429));
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const lower = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const byIp = (req) => req.ip;

module.exports = {
  rateLimit,
  RateLimitHit,
  limitLogin: [
    rateLimit({ name: 'login-ip', windowMs: 15 * MINUTE, max: 10, key: byIp }),
    rateLimit({ name: 'login-user', windowMs: 15 * MINUTE, max: 10, key: (req) => lower(req.body?.username) }),
  ],
  limitRegister: [
    rateLimit({ name: 'register-ip', windowMs: HOUR, max: 5, key: byIp }),
  ],
  limitForgotPassword: [
    rateLimit({ name: 'forgot-ip', windowMs: HOUR, max: 10, key: byIp }),
    rateLimit({ name: 'forgot-email', windowMs: HOUR, max: 3, key: (req) => lower(req.body?.email) }),
  ],
};
