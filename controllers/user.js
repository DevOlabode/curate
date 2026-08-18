const User = require('../models/user');
const passport = require('passport');


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
        req.flash('error', err.message);
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

module.exports.user = async(req, res)=>{
    const { password } = req.body;
    const {id} = req.user; 
    const user = await User.findById(id);
    const auth = User.authenticate();
    auth(user.username, password , (err, user, result) => {
    if (err) {
        req.flash('error', err.message);
        res.redirect('/user/info')
    } else if (user) {
        return res.render('user/edit', { user })
    } else {
        req.flash('error', "Invalid password!");
        res.redirect('/user/info')
    }
    });
};

module.exports.editUser = async(req, res)=>{
    const { firstName, lastName, username, email} = req.body;
    const userId = req.user._id;
    const user =await User.findById(userId);

    if(!user){
        req.flash('error', 'User not found!');
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
        req.flash('error', 'New passwords do not match.');
        return res.redirect('/user/change-password');
    }

    if(currentPassword === newPassword){
        req.flash('error', 'New Passwords must be different from the currrent password');
        return res.redirect('/user/change-password')
    }

    const user = await User.findById(req.user.id);

    try {
        const isValid = await user.authenticate(currentPassword);
        if (!isValid.user) {
            req.flash('error', 'Current password is incorrect.');
            return res.redirect('/user/change-password');
        }

        await user.setPassword(newPassword);
        await user.save();

        req.flash('success', 'Password changed successfully.');
        res.redirect('/user/info');
    } catch (err) {
        req.flash('error', 'Something went wrong.');
        res.redirect('/user/change-password');
    }
};