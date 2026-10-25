const express = require('express');
const catchAsync = require('../../utils/catchAsync');
const { apiAuth } = require('../../middleware/apiAuth');
const auth = require('../../controllers/api/auth');
const { limitLogin, limitRegister, limitForgotPassword } = require('../../utils/rateLimit');

const router = express.Router();

router.post('/register', ...limitRegister, catchAsync(auth.register));
router.post('/login', ...limitLogin, catchAsync(auth.login));
router.post('/forgot-password', ...limitForgotPassword, catchAsync(auth.forgotPassword));
router.post('/reset-password', catchAsync(auth.resetPassword));
router.post('/logout', apiAuth, catchAsync(auth.logout));
router.get('/me', apiAuth, catchAsync(auth.me));
router.put('/me', apiAuth, catchAsync(auth.updateMe));
router.put('/password', apiAuth, catchAsync(auth.changePassword));
router.delete('/me', apiAuth, catchAsync(auth.deleteMe));

module.exports = router;
