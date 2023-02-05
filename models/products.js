var mongoose = require('mongoose');
var productSchema = mongoose.Schema({
	name: String,
	price: String,
	description: String,
	imageURL: String,
});

module.exports = mongoose.model('Products', productSchema);