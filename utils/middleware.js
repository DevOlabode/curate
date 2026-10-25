const { bookmarkSchema, collectionSchema} = require('../joiSchema.js');
const ExpressError = require('./expressError.js')
const { friendlyJoiMessage } = require('./friendlyError.js')
const { normalizeUrl } = require('./normalizeUrl.js')


module.exports.validateBookmark = (req, res, next)=>{
    const body = { ...req.body };
    if (typeof body.url === 'string') {
        body.url = normalizeUrl(body.url);
    }
    if (Array.isArray(body.tags)) {
        body.tags = body.tags.join(', ');
    }
    const { error, value } = bookmarkSchema.validate(body, { abortEarly: false });
    if(error){
        throw new ExpressError(friendlyJoiMessage(error), 400)
    }
    req.body = { ...req.body, ...value };
    next();
};
module.exports.validateCollection = (req, res, next)=>{
    const { error } = collectionSchema.validate(req.body, { abortEarly: false });
    if(error){
        throw new ExpressError(friendlyJoiMessage(error), 400)
    }else{
        next()
    }
};
