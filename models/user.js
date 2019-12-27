var mongoose = require("mongoose"),
passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    username: String,
    password: String,
    avatar: String,
    createdAt: {type: Date, default: Date.now},
    isAdmin: {type: Boolean, default: false}
});
 
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);