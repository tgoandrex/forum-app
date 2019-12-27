var middlewareObj = {},
Forum = require("../models/forum"),
Thread = require("../models/thread"),
Post = require("../models/post");

middlewareObj.checkForumOwnership = function(req, res, next) {
    if(req.isAuthenticated()) {
        Forum.findById(req.params.id, function(err, foundForum) {
            if(err) {
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                if(foundForum.author.id.equals(req.user._id) && req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
}

middlewareObj.checkForumLock = function(req, res, next) {
	if(req.isAuthenticated()) {
		Forum.findById(req.params.id, function(err, foundForum) {
			if(err) {
                req.flash("error", err.message);
				res.redirect("back");
			} else {
				if(!foundForum.isLocked || req.user.isAdmin) {
					return next();
				}
				req.flash("error", "This forum is currently locked. Only admins may start threads here");
				res.redirect("/forums/" + foundForum._id + "/1");
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
	}
}

middlewareObj.checkThreadOwnership = function(req, res, next) {
	if(req.isAuthenticated()) {
		Thread.findById(req.params.thread_id, function(err, foundThread) {
			if(err) {
                req.flash("error", err.message);
				res.redirect("back");
			} else {
				if(foundThread.author.id.equals(req.user._id) || req.user.isAdmin) {
					next();
				} else {
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that");
		res.redirect("back");
	}
}

middlewareObj.checkThreadLock = function(req, res, next) {
	if(req.isAuthenticated()) {
		Thread.findById(req.params.thread_id, function(err, foundThread) {
			if(err) {
                req.flash("error", err.message);
				res.redirect("back");
			} else {
				if(!foundThread.isLocked || req.user.isAdmin) {
					return next();
				}
				req.flash("error", "This thread is currently locked. Only admins may post here");
				res.redirect("/forums/" + req.params.id + "/threads/" + foundThread._id + "/1");
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
	}
}

middlewareObj.checkPostOwnership = function(req, res, next) {
	if(req.isAuthenticated()) {
		Post.findById(req.params.post_id, function(err, foundPost) {
			if(err) {
                req.flash("error", err.message);
				res.redirect("back");
			} else {
				if(foundPost.author.id.equals(req.user._id) || req.user.isAdmin) {
					next();
				} else {
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that");
		res.redirect("back");
	}
}

middlewareObj.isLoggedIn = function(req, res, next) {
	if(req.isAuthenticated()) {
		return next();
    }
    req.flash("error", "You need to be logged in to do that");
	res.redirect("/login");
}

middlewareObj.isAnAdmin = function(req, res, next) {
	if(req.isAuthenticated() && req.user.isAdmin) {
		return next();
    }
    req.flash("error", "Only admins have access here");
	res.redirect("/forums");
}

module.exports = middlewareObj;