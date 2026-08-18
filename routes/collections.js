const express = require('express');
const router = express.Router();

const { isLoggedIn, validateCollection } = require('../middleware');
const catchAsync = require('../utils/catchAsync');
const collections = require('../controllers/collections')
const { requireValidId } = require('../middleware/validateId');

router.route('/')
    .get(isLoggedIn, catchAsync(collections.index))
    .post(isLoggedIn, validateCollection, catchAsync(collections.newCollection))

router.get('/new', isLoggedIn, collections.newForm);

router.param('id', requireValidId('id', 'collection'));

router.route('/:id')
    .get(isLoggedIn, catchAsync(collections.showPage))
    .put(isLoggedIn, validateCollection, catchAsync(collections.editCollection))
    .delete(isLoggedIn, catchAsync(collections.deleteCollection))


router.get('/:id/edit', isLoggedIn, catchAsync(collections.editForm));

module.exports = router;
