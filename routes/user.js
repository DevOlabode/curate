const express = require('express');
const router = express.Router();

const catchAsync = require('../utils/catchAsync');
const user = require('../controllers/user')
const { limitForgotPassword } = require('../utils/rateLimit');

// Sign-in and the library live in the extension. The web only serves the
// password-reset pages that reset emails link to.
router.route('/forgot-password')
    .get(user.forgotPasswordForm)
    .post(...limitForgotPassword, catchAsync(user.forgotPassword))

router.route('/reset-password/:token')
    .get(catchAsync(user.resetPasswordForm))
    .post(catchAsync(user.resetPassword))

module.exports = router
