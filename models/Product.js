const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const Schema = mongoose.Schema;
const _ = require('lodash');

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

const Rating = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		required: true
	},
	value: {
		type: Number,
		min: 1,
		max: 5
	}
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
	descriptionEn: {
		type: String,
		required: true
	},
	descriptionAr: {
		type: String,
		required: true
	},
	price: {
		type: Number,
		required: true,
		validate: {
			validator: function(value){
				return value >= 0
			},
			msg: "Price is less than 0"
		}
	},
	discount: {
		type: Number,
		min: 0,
		max: 99
	},
	color: {
		type: String
	},
	details: {
		type: [Schema.Types.Mixed],
		required: true
	},
	photos: {
		type: [String],
		required: true
	},
	ratingTotal: {
		type: Number,
		required: true,
		default: 0
	},
	ratingCount: {
		type: Number,
		required: true,
		default: 0
	},
	ratings: {
		type: [Rating],
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
	// productDetails: {
	// 	type: Schema.Types.Mixed
	// },
	views: {
		type: [View],
		required: true
	},
	reviews: {
		type: [Review],
		required: true
	},
	featured: {
		type: Boolean
	},
	createdBy: {
		// Admin who created the product
		type: Schema.Types.ObjectId,
		required: true
	}
}, {
	timestamps: true
})

ProductSchema.index({
	nameEn: "text",
	nameAr: "text"
})

module.exports = mongoose.model('Product', ProductSchema);