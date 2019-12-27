var mongoose = require("mongoose"),
Forum = require("./models/forum");
 
var data = [
    {
        name: "My Forum",
        description: "Lorem ipsum"
    }
]
 
function seedDB(){
   // Remove all Forums
   Forum.remove({}, function(err){
        if(err){
            console.log(err);
        }
        console.log("removed forums!");
        // Add Forums
        data.forEach(function(seed){
            Forum.create(seed, function(err, forum){
                if(err){
                    console.log(err)
                } else {
                    console.log("added a forum");
                    console.log(forum)
                }
            });
        });
    });
}
 
module.exports = seedDB;