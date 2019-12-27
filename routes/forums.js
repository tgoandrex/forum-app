const express = require("express"),
router = express.Router(),
Forum = require("../models/forum"),
Thread = require("../models/thread"),
Post = require("../models/post"),
middleware = require("../middleware");

// Forum list route
router.get("/", function(req, res) {
	if(req.query.search) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Forum.find({name: regex}, function(err, searchedForums) {
			if(err) {
				req.flash("error", err.message);
				res.redirect("back");
			} else {
				if(searchedForums.length < 1) {
					req.flash("error", "No forums found");
					res.redirect("/forums");
				} else {
					// Begin find latest thread for each searched forum
					for(let x = 0; x < searchedForums.length; x++) {
						Forum.findById(searchedForums[x], function(err, foundForum) {
							if(err) {
								req.flash("error", err.message);
								res.redirect("back");
							} else {
								Thread.findOne({_id: foundForum.threads}, {}, {sort: {"createdAt": -1}}, function(err, latestThread) {
									if(err) {
										req.flash("error", err.message);
										res.redirect("back");
									} else {
										if(latestThread) {
											foundForum.latestThread = latestThread;
											foundForum.save();
										}
									}
								});
							}
						});
					}
					// End find latest thread
					res.render("forums/index", {forums: searchedForums});
				}
			}
		});
	} else {
		Forum.find({}, function(err, allForums) {
			if(err) {
				req.flash("error", err.message);
				res.redirect("back");
			} else {
				// Begin find latest thread for each forum
				for(let x = 0; x < allForums.length; x++) {
					Forum.findById(allForums[x], function(err, foundForum) {
						if(err) {
							req.flash("error", err.message);
							res.redirect("back");
						} else {
							Thread.findOne({_id: foundForum.threads}, {}, {sort: {"createdAt": -1}}, function(err, latestThread) {
								if(err) {
									req.flash("error", err.message);
									res.redirect("back");
								} else {
									if(latestThread) {
										foundForum.latestThread = latestThread;
										foundForum.save();
									}
								}
							});
						}
					});
				}
				// End find latest thread
				res.render("forums/index", {forums: allForums});
			}
		});
	}
});

// Forums create form route (Admin only)
router.get("/new", middleware.isAnAdmin, function(req, res) {
	res.render("forums/new");
});

// Forums create logic route (Admin only)
router.post("/", middleware.isAnAdmin, function(req, res) {
	var name = req.body.name,
	description = req.body.description,
	isLocked = req.body.lock,
	author = {
		id: req.user._id,
		username: req.user.username
	},
	newForum = {name: name, description: description, isLocked: isLocked, author: author};
	
	Forum.create(newForum, function(err) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("/forums");
		} else {
			res.redirect("/forums");
		}
	});
});

// Forums edit form route (Admin only)
router.get("/:id/edit", middleware.checkForumOwnership, function(req, res) {
	Forum.findById(req.params.id, function(err, foundForum) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("back");
		} else {
			res.render("forums/edit", {forum: foundForum});
		}
	});
});

// Forums update logic (Admin only)
router.put("/:id", middleware.checkForumOwnership, function(req, res) {
	Forum.findByIdAndUpdate(req.params.id, req.body.forum, function(err) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("back");
		} else {
            req.flash("success", "Successfully updated forum");
			res.redirect("/forums");
		}
	})
});

// Forum details route
router.get("/:id/:page", async function(req, res) {
	Forum.findById(req.params.id, async function(err, foundForum) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("back");
		} else {
			const resultsPerPage = 10,
			      page = req.params.page || 1,
				  foundThreads = await Thread.find({_id: foundForum.threads}) // To calculate threads per page for the pagination
			          .sort({"createdAt": -1})
      			      .skip((resultsPerPage * page) - resultsPerPage)
      			      .limit(resultsPerPage),
				  numberofThreads = await Thread.countDocuments({_id: foundForum.threads}),
			      threads = foundForum.threads; // To calculate latest post
			for(let x = 0; x < threads.length; x++) {
				Thread.findById(threads[x], function(err, foundThread) {
					if(err) {
						req.flash("error", err.message);
						res.redirect("back");
					} else {
						Post.findOne({_id: foundThread.posts}, {}, {sort: {"createdAt": -1}}, function(err, latestPost) {
							if(err) {
								req.flash("error", err.message);
								res.redirect("back");
							} else {
								if(latestPost) {
									foundThread.latestPost = latestPost;
									foundThread.save();
								}
							}
						});
					}
				});
			}
			res.render("forums/show", {
				forum: foundForum,
				threads: foundThreads,
				currentPage: page, 
				pages: Math.ceil(numberofThreads / resultsPerPage), 
				numberOfResults: numberofThreads
			});
		}
	});
});

// Forums destroy logic (Admin only)
router.delete("/:id", middleware.checkForumOwnership, function(req, res) {
	Forum.findByIdAndRemove(req.params.id, function(err, removedForum) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("/forums");
		} else {
			const threadsToDelete = removedForum.threads;
			for(let x = 0; x < threadsToDelete.length; x++) {
				Thread.findById(threadsToDelete[x], function(err, foundThread) {
					if(err) {
						req.flash("error", err.message);
						res.redirect("/forums");
					} else {
						Post.deleteMany({_id: {$in: foundThread.posts}}, function(err) {
							if(err) {
								req.flash("error", err.message);
								res.redirect("/forums");
							}
						});
					}
				});
			}
			Thread.deleteMany({_id: {$in: threadsToDelete}}, function(err) {
				if(err) {
					req.flash("error", err.message);
					res.redirect("/forums");
				} else {
					req.flash("success", "Successfully deleted forum and all associated threads and posts");
					res.redirect("/forums");
				}
			});
		}
	});
});

// Forums lock logic (Admin only)
router.post("/:id/lock", middleware.isAnAdmin, function(req, res) {
	Forum.findById(req.params.id, function(err, foundForum) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("/forums");
		} else {
			if(foundForum.isLocked) {
				foundForum.isLocked = false;
				foundForum.save();
				req.flash("success", "Successfully unlocked forum");
				res.redirect("/forums");
			} else {
				foundForum.isLocked = true;
				foundForum.save();
				req.flash("success", "Successfully locked forum");
				res.redirect("/forums");
			}
		}
	});
});


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;