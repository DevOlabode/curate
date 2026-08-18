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
    resetPasswordExpires: Date
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
