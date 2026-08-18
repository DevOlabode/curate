const crypto = require('crypto');

const RESET_TTL_MS = 60 * 60 * 1000;

function createResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, hashed: hashResetToken(token) };
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { RESET_TTL_MS, createResetToken, hashResetToken };
