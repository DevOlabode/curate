const express = require('express');
const catchAsync = require('../../utils/catchAsync');
const { apiAuth } = require('../../middleware/apiAuth');
const { validateBookmark, validateCollection } = require('../../middleware');
const collections = require('../../controllers/api/collections');
const { requireValidId } = require('../../middleware/validateId');

const router = express.Router();

router.use(apiAuth);
router.param('id', requireValidId('id', 'collection'));
router.param('bookmarkId', requireValidId('bookmarkId', 'bookmark'));

router.get('/', catchAsync(collections.list));
router.post('/', validateCollection, catchAsync(collections.create));
router.get('/:id', catchAsync(collections.getOne));
router.put('/:id', validateCollection, catchAsync(collections.update));
router.delete('/:id', catchAsync(collections.remove));

router.post('/:id/bookmarks', validateBookmark, catchAsync(collections.createBookmark));
router.get('/:id/bookmarks/:bookmarkId', catchAsync(collections.getBookmark));
router.put('/:id/bookmarks/:bookmarkId', validateBookmark, catchAsync(collections.updateBookmark));
router.delete('/:id/bookmarks/:bookmarkId', catchAsync(collections.removeBookmark));

module.exports = router;
