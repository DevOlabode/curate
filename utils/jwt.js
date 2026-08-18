const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function assertSecret() {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured on the server');
  }
}

function signToken(userId) {
  assertSecret();
  return jwt.sign({ sub: userId.toString() }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  assertSecret();
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken, JWT_EXPIRES_IN };
