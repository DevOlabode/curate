const mongoose = require('mongoose');
const { Schema } = mongoose;
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    email : {
        type : String,
        required : true,
        unique : true
    },
    firstName :{
        type : String,
        required : true
    },
    lastName : {
        type : String,
        required : true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    // Bumped on password change/reset; JWTs carrying an older version are rejected.
    tokenVersion: {
        type: Number,
        default: 0
    },
    // Maintainer and test accounts, excluded from metrics.
    isInternal: {
        type: Boolean,
        default: false
    }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
