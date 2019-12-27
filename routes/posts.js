const express = require("express"),
router = express.Router({mergeParams: true}),
Forum = require("../models/forum"),
Thread = require("../models/thread"),
Post = require("../models/post"),
middleware = require("../middleware");

// Posts form route
router.get("/new", middleware.checkThreadLock, function(req, res) {
    Forum.findById(req.params.id, function(err, foundForum) {
		if(err) {
            req.flash("error", err.message);
            res.redirect("back");
		} else {
            Thread.findById(req.params.thread_id, function(err, foundThread) {
                if(err) {
                    req.flash("error", err.message);
			        res.redirect("back");
                } else {
                    res.render("posts/new", {forum: foundForum, thread: foundThread});
                }
            });
        }
    });
});

// Posts create logic route
router.post("/", middleware.checkThreadLock, function(req, res) {
    Forum.findById(req.params.id, function(err, foundForum) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("/forums/" + foundForum._id + "/threads");
		} else {
            Thread.findById(req.params.thread_id, function(err, foundThread) {
                if(err) {
                    req.flash("error", err.message);
                    res.redirect("/forums/" + foundForum._id + "/threads");
                } else {
                    Post.create(req.body.post, function(err, postToCreate) {
                        if(err) {
                            req.flash("error", err.message);
			                res.redirect("back");
                        } else {
                            postToCreate.author.id = req.user._id;
                            postToCreate.author.username = req.user.username;
                            postToCreate.save();
                            foundThread.posts.push(postToCreate);
                            foundThread.save();
                            req.flash("success", "Successfully added new post");
                            res.redirect("/forums/" + foundForum._id + "/threads/" + foundThread._id + "/1");
                        }
                    });
                }
            });
        }
    });
});

// Posts edit form route
router.get("/:post_id/edit", middleware.checkPostOwnership, function(req, res) {
	Post.findById(req.params.post_id, function(err, foundPost) {
		if(err) {
            req.flash("error", err.message);
			res.redirect("back");
		} else {
			res.render("posts/edit", {forum_id: req.params.id, thread_id: req.params.thread_id, post: foundPost});
		}
	});
});

// Posts update logic
router.put("/:post_id", middleware.checkPostOwnership, function(req, res) {
	Post.findByIdAndUpdate(req.params.post_id, req.body.post, function(err) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("back");
		} else {
            req.flash("success", "Successfully updated post");
			res.redirect("/forums/" + req.params.id + "/threads/" + req.params.thread_id + "/1");
		}
	})
});

// Posts destroy logic
router.delete("/:post_id", middleware.checkPostOwnership, function(req, res) {
	Post.findByIdAndRemove(req.params.post_id, function(err) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("back");
		} else {
            Thread.findByIdAndUpdate(req.params.thread_id, {$pull: {posts: req.params.post_id}}, function(err){
                if(err){
                    req.flash("error", err.message);
                } else {
                    req.flash("success", "Successfully deleted post");
                    res.redirect("/forums/" + req.params.id + "/threads/" + req.params.thread_id + "/1");
                }
            });
        }
	});
});

module.exports = router;