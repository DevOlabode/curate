const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./auth');
const bookmarkRoutes = require('./bookmarks');
const collectionRoutes = require('./collections');
const { apiNotFound } = require('../../middleware/apiError');

const router = express.Router();

const HEALTH_DB_TIMEOUT_MS = 2000;

router.get('/health', async (_req, res) => {
  let timer;
  try {
    await Promise.race([
      mongoose.connection.db.admin().ping(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), HEALTH_DB_TIMEOUT_MS);
      }),
    ]);
    res.json({ ok: true, service: 'curate-api', version: '1' });
  } catch {
    res.status(503).json({ ok: false, service: 'curate-api', version: '1', error: 'Database unavailable' });
  } finally {
    clearTimeout(timer);
  }
});

router.use('/auth', authRoutes);
router.use('/bookmarks', bookmarkRoutes);
router.use('/collections', collectionRoutes);
router.use(apiNotFound);

module.exports = router;
