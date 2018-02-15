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
}, {
	timestamps: true
})

const View = new Schema({
	viewedBy: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'User'
	}
}, {
	timestamps: true
})

const ProductSchema = new Schema({
	nameEn: {
		type: String,
		required: true
	},
	nameAr: {
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
	categoryId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'Category'
	},
	brandId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'Brand'
	},
	productDetailsEn: {
		type: Schema.Types.Mixed
	},
	productDetailsAr: {
		type: Schema.Types.Mixed
	},
	views: {
		type: [View],
		required: true
	},
	reviews: {
		type: [Review],
		required: true
	}
}, {
	timestamps: true
})

module.exports = mongoose.model('Product', ProductSchema);