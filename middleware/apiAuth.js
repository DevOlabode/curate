const User = require('../models/user');
const { verifyToken } = require('../utils/jwt');

module.exports.apiAuth = async function apiAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = verifyToken(header.slice(7));
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
