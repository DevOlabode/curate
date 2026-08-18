const express = require('express');
const authRoutes = require('./auth');
const bookmarkRoutes = require('./bookmarks');
const collectionRoutes = require('./collections');
const { apiNotFound } = require('../../middleware/apiError');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'curate-api', version: '1' });
});

router.use('/auth', authRoutes);
router.use('/bookmarks', bookmarkRoutes);
router.use('/collections', collectionRoutes);
router.use(apiNotFound);

module.exports = router;
