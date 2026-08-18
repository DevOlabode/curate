const { bookmarkSchema, collectionSchema} = require('./joiSchema.js');
const passport = require('passport');
const ExpressError = require('./utils/expressError.js')
const { friendlyJoiMessage } = require('./utils/friendlyError.js')


module.exports.isLoggedIn = function(req, res, next){
    if(!req.isAuthenticated()){
        req.session.returnTo = req.originalUrl
        req.flash('warning', 'Please sign in first.');
        return res.redirect('/login');
    }
    next();
};

module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
};

module.exports.validateBookmark = (req, res, next)=>{
    const body = { ...req.body };
    if (Array.isArray(body.tags)) {
        body.tags = body.tags.join(', ');
    }
    const { error } = bookmarkSchema.validate(body, { abortEarly: false });
    if(error){
        throw new ExpressError(friendlyJoiMessage(error), 400)
    }else{
        next()
    }
};
module.exports.validateCollection = (req, res, next)=>{
    const { error } = collectionSchema.validate(req.body, { abortEarly: false });
    if(error){
        throw new ExpressError(friendlyJoiMessage(error), 400)
    }else{
        next()
    }
};


module.exports.loginAuthenticate = passport.authenticate('local', {
    failureFlash : { type: 'error', message: 'That username or password doesn’t match.' },
    failureRedirect : '/login'
});

module.exports.redirectIfLoggedIn = (req, res, next)=>{
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    next();
}