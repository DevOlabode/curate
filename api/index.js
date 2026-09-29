// Vercel serverless entry. Local dev still uses index.js with app.listen.
const app = require('../app');

require('../config/dbConfig')();

module.exports = app;
