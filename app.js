const express = require("express"),
app = express(),
bodyParser = require("body-parser"),
mongoose = require("mongoose"),
flash = require("connect-flash"),
passport = require("passport"),
localStrategy = require("passport-local"),
methodOverride = require("method-override"),
moment = require("moment"),
// Require models (next four)
User = require("./models/user"),
Forum = require("./models/forum"),
Thread = require("./models/thread"),
Post = require("./models/post"),
// Require routes (next four)
indexRoutes = require("./routes/index"),
forumRoutes = require("./routes/forums"),
threadRoutes = require("./routes/threads"),
postRoutes = require("./routes/posts"),
// seedDB = require("./seeds"), // Disabled
port = process.env.PORT || 3000,
host = '0.0.0.0';

// Mongoose config
mongoose.set('useUnifiedTopology', true);
mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.DATABASEURLFORUMAPP, // DATABASEURLFORUMAPP = "mongodb://localhost/forumapp" for localhost
{
	useNewUrlParser: true,
	useCreateIndex: true
});

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

// seedDB(); // Disabled

// Passport config
app.use(require("express-session")({
	secret: "Forums are cool.", // Secret can be any string
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// res.locals variables
app.use(async function(req, res, next) {
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	res.locals.moment = moment;
	res.locals.totalNumOfForums =  await Forum.find().countDocuments(function(err, count){return count});
	res.locals.totalNumOfThreads = await Thread.find().countDocuments(function(err, count){return count});
	res.locals.totalNumOfPosts = await Post.find().countDocuments(function(err, count){return count});
	res.locals.totalNumOfUsers = await User.find().countDocuments(function(err, count){return count});
	next();
});

// Routes config
app.use("/", indexRoutes);
app.use("/forums", forumRoutes);
app.use("/forums/:id/threads", threadRoutes);
app.use("/forums/:id/threads/:thread_id/posts", postRoutes);

app.listen(port, host, function() {
	console.log("Forum App server has started on port " + port + "!");
});