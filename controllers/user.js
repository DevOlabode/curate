const User = require('../models/user');
const { registrationErrorMessage } = require('../utils/duplicateKeyError');
const { sendPasswordResetEmail, appUrl } = require('../utils/mailer');
const { createResetToken, hashResetToken, RESET_TTL_MS } = require('../utils/passwordReset');


module.exports.signUpForm = (req, res)=>{
    res.render('user/signup')
};

module.exports.signUp = async(req, res)=>{
    try{
        const {username, password, email, firstName, lastName} = req.body;
        const user = new User({username, email, firstName, lastName})
        const registeredUser = await User.register(user, password);

        req.login(registeredUser, (err) =>{
            if(err) return next(err)
            
        req.flash('success','Welcome to Curate');
        res.redirect('/')
        })
    }catch(err){
        req.flash('error', registrationErrorMessage(err));
        res.redirect('/signup')
    }
};

module.exports.loginForm = (req, res)=>{
    res.render('user/login')
};

module.exports.login = async(req, res)=>{
    req.flash('success', 'Welcome Back');
    const returnUrl = res.locals.returnTo || '/'
    res.redirect(returnUrl)
};

module.exports.logout = async(req, res)=>{
    req.logout(function(err){
        if(err) return next(err)
});


    req.flash('success', 'Logged out your account');
    res.redirect('/');
};

module.exports.userInfo = (req, res)=>{
    res.render('user/info');
};

module.exports.editForm = async(req, res)=>{
    const user = await User.findById(req.user._id);
    if(!user){
        req.flash('error', "We couldn't find that account.");
        return res.redirect('/user/info');
    }
    res.render('user/edit', { user });
};

module.exports.editUser = async(req, res)=>{
    const { firstName, lastName, username, email} = req.body;
    const userId = req.user._id;
    const user =await User.findById(userId);

    if(!user){
        req.flash('error', "We couldn't find that account.");
        res.redirect('/user/info')
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.username = username;
    user.email = email;

    await user.save();

    req.flash('success', 'Profile updated successfully');
    res.redirect('/user/info')
};

module.exports.changepasswordForm = (req, res)=>{
    res.render('user/changePassword')
};

module.exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        req.flash('error', 'Those new passwords don’t match.');
        return res.redirect('/user/change-password');
    }

    if(currentPassword === newPassword){
        req.flash('error', 'Choose a password that’s different from your current one.');
        return res.redirect('/user/change-password')
    }

    const user = await User.findById(req.user.id);

    try {
        const isValid = await user.authenticate(currentPassword);
        if (!isValid.user) {
            req.flash('error', 'That current password isn’t correct.');
            return res.redirect('/user/change-password');
        }

        await user.setPassword(newPassword);
        await user.save();

        req.flash('success', 'Password changed successfully.');
        res.redirect('/user/info');
    } catch (err) {
        req.flash('error', 'We couldn’t change your password. Please try again.');
        res.redirect('/user/change-password');
    }
};

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
    res.redirect('/login');
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
    await user.save();

    req.flash('success', 'Your password is updated. You can sign in now.');
    res.redirect('/login');
};