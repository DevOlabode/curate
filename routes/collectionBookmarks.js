const express = require('express');
const router = express.Router({ mergeParams: true });

const { isLoggedIn, validateBookmark } = require('../middleware');
const catchAsync = require('../utils/catchAsync');
const collectionBookmark = require('../controllers/collectionBookmarks');
const { requireValidId } = require('../middleware/validateId');

router.param('id', requireValidId('id', 'collection'));
router.param('bookmarksId', requireValidId('bookmarksId', 'bookmark'));

router.get('/new', isLoggedIn, catchAsync(collectionBookmark.newBookmarkForm));

router.post('/', isLoggedIn, validateBookmark, catchAsync(collectionBookmark.newBookmark));

router.route('/:bookmarksId')
    .get(isLoggedIn, catchAsync(collectionBookmark.showPage))
    .put(isLoggedIn, validateBookmark, catchAsync(collectionBookmark.editBookmark))
    .delete(isLoggedIn, catchAsync(collectionBookmark.deleteBookmark))

router.get('/:bookmarksId/edit', isLoggedIn, catchAsync(collectionBookmark.editForm));

module.exports = router;
