var mongoose = require("mongoose");
     
var threadSchema = new mongoose.Schema({
    title: String,
    isLocked: {type: Boolean, default: false},
    createdAt: {type: Date, default: Date.now},
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    posts: [
        {
           type: mongoose.Schema.Types.ObjectId,
           ref: "Post"
        }
    ],
    latestPost: {
        _id: String,
        message: String,
        createdAt: {type: Date, default: Date.now},
        author: {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            username: String
        }
    }
});
 
module.exports = mongoose.model("Thread", threadSchema);