const mongoose = require('mongoose');
const { Schema } = mongoose;
const { normalizeUrl } = require('../utils/normalizeUrl');

const bookmarkSchema = new Schema({
    title : {
        type : String,
        required : true
    },
    url : {
        type : String,
        required : true
    },
    category : {
        type : String,
        required : false
    },
    tags : {
        type: [String],
        default: []
    },
    notes : String,

    createdAt : {
        type : Date,
        default : Date.now
    },
    user : {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    collection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collection'
    }
}, {
    suppressReservedKeysWarning: true
});

bookmarkSchema.virtual('href').get(function() {
    return normalizeUrl(this.url);
});

bookmarkSchema.pre('validate', function(next) {
    if (this.url) {
        this.url = normalizeUrl(this.url);
    }
    next();
});

bookmarkSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate() || {};
    if (typeof update.url === 'string') {
        update.url = normalizeUrl(update.url);
    }
    if (update.$set && typeof update.$set.url === 'string') {
        update.$set.url = normalizeUrl(update.$set.url);
    }
    next();
});

module.exports = mongoose.model('Bookmark', bookmarkSchema)
