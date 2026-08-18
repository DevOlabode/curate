const express = require('express');
const catchAsync = require('../../utils/catchAsync');
const { apiAuth } = require('../../middleware/apiAuth');
const { validateBookmark } = require('../../middleware');
const bookmarks = require('../../controllers/api/bookmarks');
const { requireValidId } = require('../../middleware/validateId');

const router = express.Router();

router.use(apiAuth);
router.param('id', requireValidId('id', 'bookmark'));

router.get('/', catchAsync(bookmarks.list));
router.post('/', validateBookmark, catchAsync(bookmarks.create));
router.get('/:id', catchAsync(bookmarks.getOne));
router.put('/:id', validateBookmark, catchAsync(bookmarks.update));
router.delete('/:id', catchAsync(bookmarks.remove));

module.exports = router;
