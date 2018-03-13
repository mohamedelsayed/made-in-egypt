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
		required: true,
		validate: {
			validator: function(value){
				return value >= 0
			},
			msg: "Price is less than 0"
		}
	},
	color: {
		type: String
	},
	sizes: {
		type: [String],
		required: true
	},
	quantity: {
		type: [Number],
		required: true,
		validate: [{
			validator: function(value){
				return _.isArray(value)
			},
			msg: "Quantity is not an array"
		}, {
			validator: function(value){
				if(value.length < 1){
					return false;
				}
				let valid = true;
				for (let i = 0; i < value.length; i++) {
					if(value[i] < 0 || !_.isInteger(value[i])){
						valid = false;
						break;
					}
				}
				return valid;
			},
			msg: "Quantity array is either empty or has non integer values"
		}]
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
	createdBy: {
		// Admin who created the product
		type: Schema.Types.ObjectId,
		required: true
	}
}, {
	timestamps: true
})

module.exports = mongoose.model('Product', ProductSchema);