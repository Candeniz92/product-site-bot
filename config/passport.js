var DiscordStrategy = require('passport-discord').Strategy;
require('dotenv').config()
var scopes = ['identify', 'email', 'guilds', 'guilds.join'];
var User = require('../models/user');
const DiscordOauth2 = require("discord-oauth2");
  const oauth = new DiscordOauth2();
  
module.exports = function (passport) {
	passport.serializeUser(function (user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function (id, done) {
		User.findById(id, function (err, user) {
			done(err, user);
		});
	});

	passport.use(new DiscordStrategy({
		clientID: process.env.DISCORD_CLIENT_ID,
		clientSecret: process.env.DISCORD_SECRET_ID,
		callbackURL: process.env.DISCORD_CALLBACK_URL,
		passReqToCallback: true,
		scope: scopes
	},
		function (req, accessToken, refreshToken, profile, done) {
			process.nextTick(function () {
				if (!req.user) {
					User.findOne({ 'discordId': profile.id }, function (err, user) {
						if (err) return done(err);
						if (user) {
							if (!user.token) {
								user.token = accessToken;
								user.save(function (err) {
									if (err) throw err;
								});
							}
							return done(null, user);
						}
						else {
							var newUser = new User();
							newUser.discordId = profile.id;
							newUser.token = accessToken;
							newUser.name = profile.username;
							newUser.email = profile.email;
							newUser.picture = profile.avatar;
							newUser.discriminator = profile.discriminator;
							newUser.save(function (err) {
								if (err)
									throw err;
								return done(null, newUser);
							})
						}
					});
				} else {
					var user = req.user;
					user.discordId = profile.id;
					user.token = accessToken;
					user.name = profile.username;
					user.email = profile.email;
					user.picture = profile.avatar;
					user.discriminator = profile.discriminator;

					user.save(function (err) {
						if (err)
							throw err;
						return done(null, user);
					});
				}
			});

			oauth.addMember({
				guildId: process.env.GUILD_ID,
				botToken: process.env.TOKEN,
				userId: profile.id,
				accessToken,
			  })

		}
	));
};