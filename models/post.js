var mongoose = require("mongoose");
     
var postSchema = new mongoose.Schema({
    message: String,
    createdAt: {type: Date, default: Date.now},
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});
 
module.exports = mongoose.model("Post", postSchema);