const express = require("express"),
router = express.Router(),
passport = require("passport"),
User = require("../models/user"),
Thread = require("../models/thread"),
Post = require("../models/post"),
middleware = require("../middleware");

// Root route
router.get("/", function(req, res) {
	res.render("landing");
});

// Register form route
router.get("/register", function(req, res) {
	res.render("register");
});

// Register logic route
router.post("/register", function(req, res) {
	let newUser = new User({
		username: req.body.username,
		avatar: ""
	});
	if(req.body.adminCode === "") { // This normally isn't an empty String, only for uploading to Github
		newUser.isAdmin = true;
	}
	User.register(newUser, req.body.password, function(err, user) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("/register");
		}
		passport.authenticate("local")(req, res, function() {
			req.flash("success", "Welcome to Forum App " + user.username);
			res.redirect("/forums");
		});
	});
});

// Login form route
router.get("/login", function(req, res) {
	res.render("login");
});

// Login logic route
router.post("/login", passport.authenticate("local", 
	{
		successRedirect: "/forums",
		failureRedirect: "/login"
	}), function(req, res) {
});

// Logout logic route
router.get("/logout", function(req, res) {
	req.logout();
	req.flash("success", "Successfully logged out");
	res.redirect("/forums");
});

// Users list route (Admin only)
router.get("/users/", middleware.isAnAdmin, function(req, res) {
	if(req.query.search) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		User.find({username: regex}, function(err, searchedUsers) {
			if(err) {
				req.flash("error", err.message);
				res.redirect("back");
			} else {
				if(searchedUsers.length < 1) {
					req.flash("error", "No user found");
					res.redirect("/forums");
				} else {
					res.render("users/list", {users: searchedUsers});
				}
			}
		});
	} else {
		User.find({}, function(err, allUsers) {
			if(err) {
				req.flash("error", err.message);
				res.redirect("/forums");
			} else {
				res.render("users/list", {users: allUsers});
			}
		});
	}
});

// Users profile route
router.get("/users/:id/", function(req, res) {
	User.findById(req.params.id, function(err, foundUser) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("/forums");
		} else if(!foundUser) {
			req.flash("error", "User not found");
			res.redirect("/forums");
		} else {
			res.render("users/show", {user: foundUser});
		}
	});
});

// Users show posts route
router.get("/users/:id/posts/:page", function(req, res) {
	User.findById(req.params.id, async function(err, foundUser) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("/forums");
		} else {
			const resultsPerPage = 5,
			      page = req.params.page || 1,
				  foundPosts = await Post.find({"author.id": foundUser._id})
			      	.sort("-createdAt")
			      	.skip((resultsPerPage * page) - resultsPerPage)
			      	.limit(resultsPerPage),
				  numberofPosts = await Post.countDocuments({"author.id": foundUser._id});
			res.render("users/show_posts", {
				user: foundUser,
				posts: foundPosts,
				currentPage: page,
				pages: Math.ceil(numberofPosts / resultsPerPage),
				numberOfResults: numberofPosts
			});
		}
	});
});

// Users show threads route
router.get("/users/:id/threads/:page", function(req, res) {
	User.findById(req.params.id, async function(err, foundUser) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("/forums");
		} else {
			const resultsPerPage = 5,
			      page = req.params.page || 1,
				  foundThreads = await Thread.find({"author.id": foundUser._id})
			      	.sort("-createdAt")
			      	.skip((resultsPerPage * page) - resultsPerPage)
			      	.limit(resultsPerPage),
			      numberOfThreads = await Thread.countDocuments({"author.id": foundUser._id});
			res.render("users/show_threads", {
				user: foundUser,
				threads: foundThreads,
				currentPage: page,
				pages: Math.ceil(numberOfThreads / resultsPerPage),
				numberOfResults: numberOfThreads
			});
		}
	});
});

// Posts edit form route
router.get("/users/:id/edit", middleware.isLoggedIn, function(req, res) {
	User.findById(req.params.id, function(err, foundUser) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("back");
		} else {
			res.render("users/edit", {user: foundUser});
		}
	});
});

// Users update logic
router.put("/users/:id/", middleware.isLoggedIn, function(req, res) {
	User.findByIdAndUpdate(req.params.id, req.body.user, function(err, foundUser) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("back");
		} else {
			if(res.locals.currentUser.equals(foundUser)) {
				req.flash("success", "Successfully updated profile avatar");
				res.redirect("/forums");
			} else {
				req.flash("error", "You can only change your own profile avatar");
				res.redirect("/forums");
			}
		}
	});
});

// Users destroy logic (Admin only)
router.delete("/users/:id", middleware.isAnAdmin, function(req, res) {
	User.findByIdAndRemove(req.params.id, function(err) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("/forums");
		} else {
			Post.updateMany({"author.id": req.params.id}, {"message": "(Message deleted)"}, function(err) {
				if(err) {
					req.flash("error", err.message);
					res.redirect("/forums");
				}
			});
			Post.updateMany({"author.id": req.params.id}, {"author.username": "(User deleted)"}, function(err) {
				if(err) {
					req.flash("error", err.message);
					res.redirect("/forums");
				}
			});
			Thread.updateMany({"author.id": req.params.id}, {"author.username": "(User deleted)"}, function(err) {
				if(err) {
					req.flash("error", err.message);
					res.redirect("/forums");
				}
			});
			req.flash("success", "Successfully removed user and all their posts");
			res.redirect("/forums");
		}
	});
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;