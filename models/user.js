var mongoose = require('mongoose');
var userSchema = mongoose.Schema({
	discordId: String,
	token: String,
	email: String,
	picture: String,
	name: String,
	discriminator: Number
});

module.exports = mongoose.model('User', userSchema);