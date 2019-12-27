var mongoose = require("mongoose");
     
var forumSchema = new mongoose.Schema({
   name: String,
   description: String,
   isLocked: {type: Boolean, default: false},
   createdAt: {type: Date, default: Date.now},
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String
   },
   threads: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Thread"
      }
   ],
   latestThread: {
      _id: String,
      title: String,
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
 
module.exports = mongoose.model("Forum", forumSchema);