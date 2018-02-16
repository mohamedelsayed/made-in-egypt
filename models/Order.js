const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const Schema = mongoose.Schema;

const OrderItemSchema = new Schema({
	price: {
		type: Number,
		required: true
	},
	productId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'Product'
	},
	quantity: {
		type: Number,
		required: true
	},
	productDetails: Object
}, {
	timestamps: true
})

const OrderSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'User'
	},
	price: {
		type: Number,
		require: true
	},
	items: {
		type: [OrderItemSchema],
		required: true
	},
	paymentMethod: {
		type: String,
		required: true,
		enum: ['Credit Card', 'Cash On Delivery']
	},
	state: {
		type: String,
		required: true,
		enum: ['Pending', 'Cancelled', 'On Route', 'Delivered']
	}
}, {
	timestamps: true
})

module.exports = mongoose.model('Order', OrderSchema);