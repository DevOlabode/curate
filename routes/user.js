const express = require('express');
const router = express.Router();

const catchAsync = require('../utils/catchAsync');
const user = require('../controllers/user')
const {loginAuthenticate, storeReturnTo, isLoggedIn, redirectIfLoggedIn} = require('../middleware')


router.route('/signup')
    .get(redirectIfLoggedIn, user.signUpForm)
    .post(storeReturnTo, catchAsync(user.signUp))

router.route('/login')
    .get(redirectIfLoggedIn, user.loginForm)
    .post(storeReturnTo, loginAuthenticate, catchAsync(user.login))

router.route('/forgot-password')
    .get(redirectIfLoggedIn, user.forgotPasswordForm)
    .post(redirectIfLoggedIn, catchAsync(user.forgotPassword))

router.route('/reset-password/:token')
    .get(redirectIfLoggedIn, catchAsync(user.resetPasswordForm))
    .post(redirectIfLoggedIn, catchAsync(user.resetPassword))

router.get('/logout', catchAsync(user.logout));

router.get('/user/info', isLoggedIn, user.userInfo);

router.route('/user/edit')
    .get(isLoggedIn, catchAsync(user.editForm))
    .put(isLoggedIn, catchAsync(user.editUser));

router.route('/user/change-password')
    .get(isLoggedIn, user.changepasswordForm)
    .put(isLoggedIn, catchAsync(user.changePassword))

module.exports = router
