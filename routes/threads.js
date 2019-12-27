const express = require("express"),
router = express.Router({mergeParams: true}),
Forum = require("../models/forum"),
Thread = require("../models/thread"),
Post = require("../models/post"),
middleware = require("../middleware");

// Threads form route
router.get("/new", middleware.checkForumLock, function(req, res) {
	Forum.findById(req.params.id, function(err, foundForum) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("/forums");
		} else {
			res.render("threads/new", {forum: foundForum});
		}
	});
});

// Threads create logic route
router.post("/", middleware.checkForumLock, function(req, res) {
	Forum.findById(req.params.id, function(err, foundForum) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("/forums");
		} else {
			Thread.create(req.body.thread, function(err, threadToCreate) {
				if(err) {
					req.flash("error", err.message);
				} else {
					Post.create(req.body.post, function(err, firstPost) {
						if(err) {
							req.flash("error", err.message);
						} else {
							firstPost.author.id = req.user._id;
							firstPost.author.username = req.user.username;
							firstPost.save();
							threadToCreate.author.id = req.user._id;
							threadToCreate.author.username = req.user.username;
							threadToCreate.isLocked = req.body.lock;
							threadToCreate.posts.push(firstPost);
							threadToCreate.save();
							foundForum.threads.push(threadToCreate);
							foundForum.save();
							req.flash("success", "Successfully added new thread and first post");
							res.redirect("/forums/" + foundForum._id + "/1");
						}
					});
				}
			});
		}
	});
});

// Thread details route
router.get("/:thread_id/:page", async function(req, res) {
	Thread.findById(req.params.thread_id, async function(err, foundThread) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("/forums");
		} else {
			const resultsPerPage = 10,
			      page = req.params.page || 1,
			      foundPosts = await Post.find({_id: foundThread.posts})
      			      .skip((resultsPerPage * page) - resultsPerPage)
      			      .limit(resultsPerPage),
			      numberOfPosts = await Post.countDocuments({_id: foundThread.posts});
			res.render("threads/show", {
				forum_id: req.params.id,
				thread: foundThread,
				posts: foundPosts,
				currentPage: page, 
				pages: Math.ceil(numberOfPosts / resultsPerPage), 
				numberOfResults: numberOfPosts
			});
		}
	});
});

// Threads destroy logic
router.delete("/:thread_id", middleware.checkThreadOwnership, function(req, res) {
	Thread.findByIdAndRemove(req.params.thread_id, function(err, removedThread) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("/forums");
		} else {
			Post.deleteMany({_id: {$in: removedThread.posts}}, function(err) {
				if(err) {
					req.flash("error", err.message);
					res.redirect("/forums");
				} else {
					Forum.findByIdAndUpdate(req.params.id, {$pull: {threads: req.params.thread_id}}, function(err) {
						if(err){
							req.flash("error", err.message);
						} else {
							req.flash("success", "Successfully deleted thread and associated posts");
							res.redirect("/forums/" + req.params.id + "/1");
						}
					});
				}
			});
		}
	});
});

// Threads lock logic (Admin only)
router.post("/:thread_id/lock", middleware.isAnAdmin, function(req, res) {
	Thread.findById(req.params.thread_id, function(err, foundThread) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("/forums");
		} else {
			if(foundThread.isLocked) {
				foundThread.isLocked = false;
				foundThread.save();
				req.flash("success", "Successfully unlocked thread");
				res.redirect("/forums/" + req.params.id + "/1");
			} else {
				foundThread.isLocked = true;
				foundThread.save();
				req.flash("success", "Successfully locked thread");
				res.redirect("/forums/" + req.params.id + "/1");
			}
		}
	});
});

module.exports = router;