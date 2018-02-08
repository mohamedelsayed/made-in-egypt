const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const Schema = mongoose.Schema;

const Review = new Schema({
	reviewer: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'User'
	},
	content: {
		type: String,
		required: true
	}
})

const ProductSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true
	},
	price: {
		type: Number,
		required: true
	},
	quantity: {
		type: Number,
		required: true
	},
	photos: {
		type: [String],
		required: true
	},
	ratingTotal: {
		type: Number,
		required: true
	},
	ratingCount: {
		type: Number,
		required: true
	},
	category: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'Category'
	},
	brand: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'Brand'
	},
	productDetails: {
		type: Object
	}
})

module.exports = mongoose.model('Product', ProductSchema);