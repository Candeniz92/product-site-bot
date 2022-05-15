require('dotenv').config();
const prefix = process.env.PREFIX;
const { Client, MessageEmbed } = require("discord.js"); 
const client = new Client({
  intents: 32767, presence: { status: "online", activities: [{ name: process.env.STATUS, type: "WATCHING" }] }
});
module.exports = client;

client.login(process.env.TOKEN).catch(err => {console.error("Invalid token!")});
client.on("ready", () => { console.log('Bot online!') });

const productModel = require("./models/products")
var scopes = ['identify', 'email', 'guilds', 'guilds.join'];
module.exports = function (app, passport) {
	app.get('/', function (req, res) {
		res.render('index.ejs');
	});

	app.get('/panel', isLoggedIn, function (req, res) {
		productModel.find((err, data) => {
			if (!err) {
				res.render("panel", {
					user: req.user,
					data: data
				});
			} else {
				console.log(err);
			}
		});
	});

	app.get('/products', function (req, res) {
		productModel.find((err, data) => {
			if (!err) {
				res.render("products", {
					data: data
				});
			} else {
				console.log(err);
			}
		});
	});

	app.get('/products/create', isLoggedIn, function (req, res) {
		res.render('create.ejs', { user: req.user });
	});

	app.post('/send', isLoggedIn, function async(req, res) {
		const { name, price, description, imageURL } = req.body
		const newProduct = { name, price, description, imageURL }
		try {
			productModel.create(newProduct)
			res.redirect('/panel');
		} catch (error) {
			console.log(error)
		}
	});

	app.get('/buy/:id', isLoggedIn, function (req, res) {
		let data = {
			_id: req.params.id
		};
		
		productModel.findOne(data)
			.then(data => {
				let sunucu = client.guilds.cache.get(process.env.GUILD_ID);
				let kanal = sunucu.channels.cache.find(c => c.name === `ticket-${req.user.discordId}`);
				let user = sunucu.members.cache.get(req.user.discordId);
				if(!user) { res.redirect('https://discord.gg/pyaFsHRWEG'); return }
				let yazi = process.env.PRODUCT_MESSAGE;
			  	let mesajj = yazi.replace(/`?\?user`?/g, `${req.user.name}#${req.user.discriminator}`).replace(/`?\?product`?/g, `${data.name}`);
			  const embed = new MessageEmbed()
			  .setTitle(mesajj)
			  .setFooter({ text: `To close the ticket: type ${prefix}close`})
			  .setTimestamp();
		  
			  if(!kanal) {
				sunucu.channels.create(`ticket-${req.user.discordId}`, {
				  type: 'text',
				  permissionOverwrites: [
					{
					  id: sunucu.roles.everyone.id,
					  deny: ['VIEW_CHANNEL']
					},
					{
					  id: req.user.discordId,
					  allow: ['VIEW_CHANNEL']
					},
					{
						id: process.env.SUPPORT_ROLE,
						allow: ['VIEW_CHANNEL']
					}
				  ],
				}).then(newChannel => {
				  newChannel.setParent(process.env.CATEGORY , {lockPermissions: false});
				  newChannel.send({content:`<@${process.env.OWNER}>` ,embeds:[embed]});
				});
			  } else {
				kanal.send({content:`<@${process.env.OWNER}>` ,embeds:[embed]});
			  }
				req.flash('error_msg', `Sipariş oluşturuldu`);
				res.redirect('back');
			})
			.catch(err => {
				req.flash('error_msg', 'ERROR: ' + err);
				res.redirect('back');
			});
	});

	app.get('/edit/:id', isLoggedIn, function (req, res) {
		let data = {
			_id: req.params.id
		};
		productModel.findOne(data)
			.then(data => {
				res.render('edit', {
					data: data
				});
			})
			.catch(err => {
				req.flash('error_msg', 'ERROR: ' + err);
				res.redirect('/');
			})
	});

	app.post('/edit/:id', isLoggedIn, function (req, res) {
		let data = {
			_id: req.params.id
		};
		
		productModel.updateOne(data,{
			$set:{
				name: req.body.name,
				price: req.body.price,
				description: req.body.description,
				imageURL: req.body.imageURL
			},
		}).then(productModel => {
			req.flash('success_msg', `${req.body.title} Başarıyla güncellendi`);
			res.redirect("/panel");
		})
		.catch(err => {			
            req.flash('error_msg', 'ERROR: ' + err);
            res.redirect('/panel');
        })
	})

	app.get('/delete/:id', isLoggedIn, function (req, res) {
		let data = {
			_id: req.params.id
		};

		productModel.deleteOne(data)
			.then(data => {
				req.flash('error_msg', `Başarıyla silindi`);
				res.redirect("/panel");
			})
			.catch(err => {
				req.flash('error_msg', 'ERROR: ' + err);
				res.redirect('/panel');
			});
	});

	app.get('/auth/discord', passport.authenticate('discord', {
		scope: scopes
	}));

	app.get('/callback', passport.authenticate('discord', {
		successRedirect: '/',
		failureRedirect: '/'
	}));

	app.get('/connect/discord', passport.authorize('discord', { scope: scopes }))


	app.get('/logout', function (req, res) {
		req.logout();
		res.redirect('/');
	})
};

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/');
}

// Ticket Close
client.on('messageCreate', async message => {
	let kanal = message.guild.channels.cache.find(c => c.name === `ticket-${message.member.id}`);
if (message.content == `${prefix}close`) {
	if(!message.member.roles.cache.has(process.env.SUPPORT_ROLE)) return;
    if(!message.channel.name.includes("ticket")) return;
    const closemebed = new MessageEmbed()
      .setDescription(`Ticket will be deleted in 5 seconds`)
    if(!kanal) { 
      newChannel.send({ embeds: [closemebed] })
      setTimeout(async () => {
        try {
          newChannel.delete()
        } catch (e) {
          newChannel.send(`An error occurred, please try again!`)         
        }
      }, 4000)
    } else { 
      kanal.send({ embeds: [closemebed] })
      setTimeout(async () => {
        try {
          kanal.delete()
        } catch (e) {
          kanal.send(`An error occurred, please try again!`)         
        }
      }, 4000)
    }
  }
})