const User = require('../models/user');
const { sendPasswordResetEmail, appUrl } = require('../utils/mailer');
const { createResetToken, hashResetToken, RESET_TTL_MS } = require('../utils/passwordReset');


module.exports.forgotPasswordForm = (req, res) => {
    res.render('user/forgotPassword');
};

module.exports.forgotPassword = async (req, res) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    const genericMessage = 'If that email is in Curate, we sent a reset link. Check your inbox.';

    if (!email) {
        req.flash('error', 'Please enter the email on your account.');
        return res.redirect('/forgot-password');
    }

    const user = await User.findOne({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });

    if (user) {
        const { token, hashed } = createResetToken();
        user.resetPasswordToken = hashed;
        user.resetPasswordExpires = new Date(Date.now() + RESET_TTL_MS);
        await user.save();

        const resetUrl = `${appUrl(req)}/reset-password/${token}`;
        try {
            await sendPasswordResetEmail({
                req,
                to: user.email,
                resetUrl,
                firstName: user.firstName,
            });
        } catch (err) {
            console.error('Password reset email failed:', err.message);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            req.flash('error', 'We couldn’t send that email right now. Please try again in a few minutes.');
            return res.redirect('/forgot-password');
        }
    }

    req.flash('success', genericMessage);
    res.redirect('/forgot-password');
};

module.exports.resetPasswordForm = async (req, res) => {
    const hashed = hashResetToken(req.params.token);
    const user = await User.findOne({
        resetPasswordToken: hashed,
        resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
        req.flash('error', 'That reset link is invalid or has expired. Request a new one.');
        return res.redirect('/forgot-password');
    }

    res.render('user/resetPassword', { token: req.params.token });
};

module.exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || password.length < 8) {
        req.flash('error', 'Please choose a password with at least 8 characters.');
        return res.redirect(`/reset-password/${token}`);
    }

    if (password !== confirmPassword) {
        req.flash('error', 'Those passwords don’t match.');
        return res.redirect(`/reset-password/${token}`);
    }

    const hashed = hashResetToken(token);
    const user = await User.findOne({
        resetPasswordToken: hashed,
        resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
        req.flash('error', 'That reset link is invalid or has expired. Request a new one.');
        return res.redirect('/forgot-password');
    }

    await user.setPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    req.flash('success', 'Your password is updated. Sign in from the Curate extension.');
    res.redirect('/');
};