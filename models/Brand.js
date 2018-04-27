const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const Schema = mongoose.Schema;

const BrandSchema = new Schema({
	nameEn: {
		type: String,
		required: true,
		unique: true
	},
	nameAr: {
		type: String,
		required: true,
		unique: true
	},
	logo: {
		type: String
	}
}, {
	timestamps: true
})

BrandSchema.index({
	nameEn: "text",
	nameAr: "text"
})

module.exports = mongoose.model('Brand', BrandSchema);