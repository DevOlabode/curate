const express = require('express');
const catchAsync = require('../../utils/catchAsync');
const { apiAuth } = require('../../middleware/apiAuth');
const auth = require('../../controllers/api/auth');

const router = express.Router();

router.post('/register', catchAsync(auth.register));
router.post('/login', catchAsync(auth.login));
router.post('/logout', apiAuth, catchAsync(auth.logout));
router.get('/me', apiAuth, catchAsync(auth.me));

module.exports = router;
