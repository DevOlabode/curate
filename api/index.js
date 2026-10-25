// Vercel serverless entry. Local dev still uses index.js with app.listen.
const mongoose = require('mongoose');
const app = require('../app');
const connectDB = require('../config/dbConfig');

// Don't exit when the database is down: keep serving so /api/v1/health can
// answer 503, and retry the connection on the next request.
let connecting = null;
function ensureDb() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  connecting ||= connectDB().finally(() => {
    connecting = null;
  });
  return connecting;
}

module.exports = async (req, res) => {
  await ensureDb().catch(() => {}); // already logged by connectDB
  return app(req, res);
};
