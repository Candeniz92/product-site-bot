require('dotenv').config()
var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mongoose = require('mongoose');
var passport = require('passport');
const flash = require('connect-flash');
app.set('view engine', 'ejs');

const port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGODB_URL, () => { console.log('Connected DB')});

require('./config/passport')(passport);
app.use(flash());
app.use(express.static('public'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(session({
	secret: process.env.SESSION_SECRET,
	saveUninitialized: true,
	resave: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(function (req, res, next) {
	    res.locals.success_msg = req.flash(('success_msg'));
    res.locals.error_msg = req.flash(('error_msg'));
    res.locals.error = req.flash(('error'));
	res.locals.user = req.user
	next();
});

require('./routes.js')(app, passport);

app.listen(port, () => {
	console.log(`Listening ${port}`);
});