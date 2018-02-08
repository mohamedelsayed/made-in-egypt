const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const Schema = mongoose.Schema;

const BrandSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	logo: {
		type: String
	}
})

module.exports = mongoose.model('Brand', BrandSchema);